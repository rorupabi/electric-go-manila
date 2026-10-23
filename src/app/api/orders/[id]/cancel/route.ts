import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { orders } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { CUSTOMER_CANCELLABLE, restoreStock, transition } from '@/lib/orders';
import { jsonError, jsonRouteError } from '@/lib/api';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const order = (await db.select({ userId: orders.userId }).from(orders).where(eq(orders.id, id)).limit(1))[0];
    if (!order || order.userId !== user.id) return jsonError('not_found', 404);

    const ok = await db.transaction(async (tx) => {
      const moved = await transition(tx, id, CUSTOMER_CANCELLABLE, 'cancelled', { cancelledReason: 'Cancelled by customer' });
      if (moved) await restoreStock(tx, id);
      return moved;
    });
    if (!ok) return jsonError('bad_status', 409);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
