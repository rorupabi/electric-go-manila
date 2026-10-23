import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Package } from 'lucide-react';
import { db } from '@/lib/db/client';
import { orders } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { STATUS_LABEL } from '@/lib/orders';
import { EmptyState, PageHeader, StatusBadge } from '@/components/ui';
import { formatDateTime, formatPHP } from '@/lib/utils';

export const metadata: Metadata = { title: 'My orders' };
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/orders');
  const rows = await db
    .select({ id: orders.id, number: orders.number, status: orders.status, totalPhp: orders.totalPhp, createdAt: orders.createdAt })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return (
    <div className="container-page py-10">
      <PageHeader title="My orders" />
      {rows.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Package className="h-6 w-6" />} title="No orders yet." hint="When you check out, your orders show up here." action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>} />
        </div>
      ) : (
        <ul className="card divide-y divide-border">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface-soft">
                <div>
                  <p className="font-semibold">{o.number}</p>
                  <p className="text-sm text-ink-soft">{formatDateTime(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} label={STATUS_LABEL[o.status]} />
                  <span className="font-semibold">{formatPHP(o.totalPhp)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
