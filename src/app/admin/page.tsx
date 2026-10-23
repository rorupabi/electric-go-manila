import Link from 'next/link';
import type { Metadata } from 'next';
import { and, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { orders, products } from '@/lib/db/schema';
import { STATUS_LABEL } from '@/lib/orders';
import { PageHeader, StatusBadge } from '@/components/ui';
import { formatDateTime, formatPHP } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminHome() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [[review], [toFulfil], [sales], lowStock, recent] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.status, 'payment_review')),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ['paid', 'ready'])),
    db.select({ total: sql<number>`coalesce(sum(${orders.totalPhp}), 0)::int` }).from(orders)
      .where(and(inArray(orders.status, ['paid', 'ready', 'completed']), gte(orders.createdAt, monthStart))),
    db.select({ id: products.id, name: products.name, stock: products.stock }).from(products)
      .where(and(eq(products.status, 'active'), lte(products.stock, 2))).limit(8),
    db.select({ id: orders.id, number: orders.number, status: orders.status, totalPhp: orders.totalPhp, createdAt: orders.createdAt })
      .from(orders).orderBy(desc(orders.createdAt)).limit(8),
  ]);

  const tiles = [
    { label: 'Receipts to check', value: String(review.n), href: '/admin/orders?status=payment_review' },
    { label: 'Paid, to hand over', value: String(toFulfil.n), href: '/admin/orders?status=paid' },
    { label: 'Paid sales this month', value: formatPHP(sales.total), href: '/admin/orders' },
  ];

  return (
    <>
      <PageHeader title="Overview" />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card p-5 hover:shadow-md">
            <p className="text-sm text-ink-soft">{t.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{t.value}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section className="card overflow-hidden">
          <h2 className="border-b border-border px-5 py-3 font-semibold">Latest orders</h2>
          {recent.length === 0 ? <p className="p-5 text-sm text-ink-soft">No orders yet.</p> : (
            <ul className="divide-y divide-border text-sm">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-surface-soft">
                    <span><span className="font-semibold">{o.number}</span> <span className="text-ink-soft">· {formatDateTime(o.createdAt)}</span></span>
                    <span className="flex items-center gap-3"><StatusBadge status={o.status} label={STATUS_LABEL[o.status]} /><span className="font-semibold">{formatPHP(o.totalPhp)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card h-fit overflow-hidden">
          <h2 className="border-b border-border px-5 py-3 font-semibold">Low stock</h2>
          {lowStock.length === 0 ? <p className="p-5 text-sm text-ink-soft">Everything is stocked.</p> : (
            <ul className="divide-y divide-border text-sm">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex justify-between gap-2 px-5 py-2.5 hover:bg-surface-soft">
                    <span className="truncate">{p.name}</span>
                    <span className={p.stock === 0 ? 'font-semibold text-red-700' : 'font-semibold text-amber-700'}>{p.stock}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
