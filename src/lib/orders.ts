import 'server-only';
import { randomInt } from 'crypto';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { db, type Tx } from '@/lib/db/client';
import { orderItems, orders, products, type Fulfillment, type OrderStatus } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/catalog';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  payment_review: 'Checking payment',
  paid: 'Paid',
  ready: 'Ready for pickup / out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Orders still holding stock that a customer may cancel themselves. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ['awaiting_payment'];
/** Orders an admin may cancel (stock is returned). */
export const ADMIN_CANCELLABLE: OrderStatus[] = ['awaiting_payment', 'payment_review', 'paid'];

export class OutOfStockError extends Error {
  constructor() { super('out_of_stock'); }
}

function orderNumber(): string {
  const d = new Date(Date.now() + 8 * 3600_000).toISOString().slice(2, 10).replace(/-/g, '');
  return `EGM-${d}-${randomInt(1000, 10000)}`;
}

/**
 * Places an order with server-side prices. Stock is taken with a conditional UPDATE inside the
 * transaction, so two shoppers can never both buy the last unit (and stock never goes below 0).
 */
export async function placeOrder(input: {
  userId: string;
  items: { productId: string; quantity: number }[];
  fulfillment: Fulfillment;
  contactName: string;
  contactPhone: string;
  address?: string;
  notes?: string;
}): Promise<{ id: string; number: string }> {
  const merged = new Map<string, number>();
  for (const it of input.items) merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
  const settings = await getShopSettings();

  return db.transaction(async (tx) => {
    const lines: { productId: string; name: string; unitPricePhp: number; quantity: number }[] = [];
    for (const [productId, quantity] of merged) {
      const [row] = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${quantity}`, updatedAt: new Date() })
        .where(and(eq(products.id, productId), eq(products.status, 'active'), gte(products.stock, quantity)))
        .returning({ name: products.name, pricePhp: products.pricePhp });
      if (!row) throw new OutOfStockError();
      lines.push({ productId, name: row.name, unitPricePhp: row.pricePhp, quantity });
    }
    const subtotal = lines.reduce((s, l) => s + l.unitPricePhp * l.quantity, 0);
    const deliveryFee = input.fulfillment === 'delivery' ? settings.deliveryFeePhp : 0;

    let created: { id: string; number: string } | undefined;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      [created] = await tx.insert(orders).values({
        number: orderNumber(),
        userId: input.userId,
        fulfillment: input.fulfillment,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        address: input.fulfillment === 'delivery' ? input.address ?? null : null,
        notes: input.notes || null,
        subtotalPhp: subtotal,
        deliveryFeePhp: deliveryFee,
        totalPhp: subtotal + deliveryFee,
      }).onConflictDoNothing({ target: orders.number }).returning({ id: orders.id, number: orders.number });
    }
    if (!created) throw new Error('Could not allocate an order number');
    await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: created!.id })));
    return created;
  });
}

/** Puts an order's units back on the shelf. Call inside the same transaction that cancels it. */
export async function restoreStock(tx: Tx, orderId: string): Promise<void> {
  const items = await tx
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    if (!it.productId) continue;
    await tx.update(products)
      .set({ stock: sql`${products.stock} + ${it.quantity}`, updatedAt: new Date() })
      .where(eq(products.id, it.productId));
  }
}

/**
 * Moves an order from one of `from` to `to` only if it is still in one of `from`.
 * Returns false when another request changed it first.
 */
export async function transition(tx: Tx, orderId: string, from: OrderStatus[], to: OrderStatus, extra: Partial<typeof orders.$inferInsert> = {}): Promise<boolean> {
  const rows = await tx.update(orders)
    .set({ status: to, updatedAt: new Date(), ...extra })
    .where(and(eq(orders.id, orderId), inArray(orders.status, from)))
    .returning({ id: orders.id });
  return rows.length > 0;
}
