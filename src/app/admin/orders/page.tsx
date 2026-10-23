import Link from 'next/link';
import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { orders, users, type OrderStatus } from '@/lib/db/schema';
import { STATUS_LABEL } from '@/lib/orders';
import { PageHeader, StatusBadge } from '@/components/ui';
import { cn, formatDateTime, formatPHP } from '@/lib/utils';

export const metadata: Metadata = { title: 'Orders' };

const FILTERS: (OrderStatus | 'all')[] = ['all', 'payment_review', 'awaiting_payment', 'paid', 'ready', 'completed', 'cancelled'];

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = FILTERS.includes(sp.status as OrderStatus) && sp.status !== 'all' ? (sp.status as OrderStatus) : null;
  const rows = await db
    .select({
      id: orders.id, number: orders.number, status: orders.status, totalPhp: orders.totalPhp,
      createdAt: orders.createdAt, fulfillment: orders.fulfillment, customer: users.name,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <>
      <PageHeader title="Orders" />
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === 'all' ? '/admin/orders' : `/admin/orders?status=${f}`}
            className={cn('btn btn-sm', (status ?? 'all') === f ? 'btn-primary' : 'btn-outline')}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f].split(' / ')[0]}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <p className="p-8 text-center text-sm text-ink-soft">No orders in this view.</p> : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-surface-soft">
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">{o.number}</Link><br /><span className="text-xs text-ink-soft">{formatDateTime(o.createdAt)}</span></td>
                  <td className="px-4 py-3">{o.customer}</td>
                  <td className="px-4 py-3 capitalize">{o.fulfillment}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} label={STATUS_LABEL[o.status]} /></td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPHP(o.totalPhp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
