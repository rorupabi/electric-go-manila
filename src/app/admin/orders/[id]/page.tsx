import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { ChevronLeft } from 'lucide-react';
import { db } from '@/lib/db/client';
import { orderItems, orders, paymentReceipts, users } from '@/lib/db/schema';
import { signedReceiptUrl } from '@/lib/storage/file-access';
import { STATUS_LABEL } from '@/lib/orders';
import { StatusBadge } from '@/components/ui';
import { displayPhone, formatDateTime, formatPHP } from '@/lib/utils';
import { OrderActions } from './order-actions';

export const metadata: Metadata = { title: 'Order' };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = (await db.select({ order: orders, customerEmail: users.email }).from(orders)
    .innerJoin(users, eq(users.id, orders.userId)).where(eq(orders.id, id)).limit(1))[0];
  if (!row) notFound();
  const { order } = row;
  const [items, receipts] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(paymentReceipts).where(eq(paymentReceipts.orderId, id)).orderBy(desc(paymentReceipts.submittedAt)),
  ]);
  // Admin-only page (checked in the layout), so signing the private receipt links is allowed here.
  const receiptLinks = await Promise.all(receipts.map((r) => signedReceiptUrl(r.fileUrl)));

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-ink-soft hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Orders
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.number}</h1>
          <p className="text-sm text-ink-soft">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} label={STATUS_LABEL[order.status]} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <h2 className="border-b border-border px-5 py-3 font-semibold">Payment receipts</h2>
            {receipts.length === 0 ? <p className="p-5 text-sm text-ink-soft">No receipt uploaded yet.</p> : (
              <ul className="divide-y divide-border">
                {receipts.map((r, i) => {
                  const link = receiptLinks[i];
                  const isPdf = r.fileUrl.toLowerCase().endsWith('.pdf');
                  return (
                    <li key={r.id} className="grid gap-4 p-5 sm:grid-cols-[12rem_1fr]">
                      <div>
                        {!link ? <p className="text-sm text-ink-soft">File unavailable.</p>
                          : isPdf ? <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Open PDF receipt</a>
                          : (
                            <a href={link} target="_blank" rel="noopener noreferrer" title="Open full size">
                              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth optimizing */}
                              <img src={link} alt="Payment receipt" loading="lazy" className="max-h-64 w-full rounded-lg border border-border object-contain" />
                            </a>
                          )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className={`badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-blue'}`}>{r.status}</span></p>
                        <p className="text-ink-soft">Submitted {formatDateTime(r.submittedAt)}</p>
                        {r.referenceNumber ? <p>Reference: <span className="font-medium">{r.referenceNumber}</span></p> : null}
                        {r.rejectionReason ? <p className="text-red-700">Reason: {r.rejectionReason}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <h2 className="border-b border-border px-5 py-3 font-semibold">Items</h2>
            <ul className="divide-y divide-border text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3 px-5 py-3">
                  <span>{it.name} × {it.quantity}</span><span className="font-medium">{formatPHP(it.unitPricePhp * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-border px-5 py-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><span>{order.deliveryFeePhp ? formatPHP(order.deliveryFeePhp) : 'Free'}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total to receive</span><span>{formatPHP(order.totalPhp)}</span></div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-2 p-5 text-sm">
            <h2 className="font-semibold capitalize">{order.fulfillment}</h2>
            <p>{order.contactName}<br /><span className="text-ink-soft">{displayPhone(order.contactPhone)} · {row.customerEmail}</span></p>
            {order.address ? <p className="whitespace-pre-line">{order.address}</p> : null}
            {order.notes ? <p className="text-ink-soft">Note: {order.notes}</p> : null}
            {order.cancelledReason ? <p className="text-red-700">Cancelled: {order.cancelledReason}</p> : null}
          </section>
          <OrderActions orderId={order.id} status={order.status} fulfillment={order.fulfillment} />
        </aside>
      </div>
    </>
  );
}
