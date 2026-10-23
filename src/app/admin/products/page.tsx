import Link from 'next/link';
import type { Metadata } from 'next';
import { asc, desc, sql } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { categoryLabel } from '@/lib/catalog';
import { PageHeader } from '@/components/ui';
import { formatPHP } from '@/lib/utils';

export const metadata: Metadata = { title: 'Products' };

export default async function AdminProducts() {
  const rows = await db
    .select({
      id: products.id, name: products.name, brand: products.brand, category: products.category,
      pricePhp: products.pricePhp, stock: products.stock, status: products.status,
      // Qualified by hand: Drizzle leaves columns unqualified inside a sql`` subquery.
      photos: sql<number>`(select count(*)::int from product_photos pp where pp.product_id = "products"."id")`,
    })
    .from(products)
    .orderBy(asc(products.category), desc(products.createdAt));

  return (
    <>
      <PageHeader title="Products" subtitle={`${rows.length} total`} action={<Link href="/admin/products/new" className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden /> Add product</Link>} />
      <div className="card overflow-x-auto">
        {rows.length === 0 ? <p className="p-8 text-center text-sm text-ink-soft">No products yet. Add your first one.</p> : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-surface-soft">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-brand hover:underline">{p.name}</Link>
                    <br /><span className="text-xs text-ink-soft">{p.brand} · {p.photos} photo{p.photos === 1 ? '' : 's'}</span>
                  </td>
                  <td className="px-4 py-3">{categoryLabel(p.category, true)}</td>
                  <td className="px-4 py-3 text-right">{formatPHP(p.pricePhp)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.stock === 0 ? 'text-red-700' : p.stock <= 2 ? 'text-amber-700' : ''}`}>{p.stock}</td>
                  <td className="px-4 py-3"><span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{p.status === 'active' ? 'Live' : 'Draft'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
