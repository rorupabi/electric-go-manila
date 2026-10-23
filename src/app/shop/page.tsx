import Link from 'next/link';
import type { Metadata } from 'next';
import { Search, SearchX } from 'lucide-react';
import { CATEGORIES, TIERS } from '@/lib/db/schema';
import { cleanQuery, isCategory, isTier, listProducts, type ProductCard as Card, type SortKey } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';
import { EmptyState, PageHeader } from '@/components/ui';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Shop' };
export const dynamic = 'force-dynamic';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Entry to high-end' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'newest', label: 'Newest' },
];

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; tier?: string; sort?: string }> }) {
  const sp = await searchParams;
  const category = isCategory(sp.category) ? sp.category : undefined;
  const tier = isTier(sp.tier) ? sp.tier : undefined;
  const sort = SORTS.some((s) => s.key === sp.sort) ? (sp.sort as SortKey) : 'featured';
  const q = cleanQuery(sp.q);
  const items = await listProducts({ q: q || undefined, category, tier, sort });

  const categoryName = category ? CATEGORIES.find((c) => c.code === category)!.label : 'All rides';
  const tierInfo = tier ? TIERS.find((t) => t.code === tier)! : null;

  const href = (next: { q?: string; category?: string; tier?: string; sort?: string }) => {
    const params = new URLSearchParams();
    const term = 'q' in next ? next.q : q;
    if (term) params.set('q', term);
    const c = 'category' in next ? next.category : category;
    const t = 'tier' in next ? next.tier : tier;
    const s = 'sort' in next ? next.sort : sort;
    if (c) params.set('category', c);
    if (t) params.set('tier', t);
    if (s && s !== 'featured') params.set('sort', s);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  // In the default order, show a heading at each tier change so the ladder is easy to scan.
  const grouped = sort === 'featured' && !tier;
  const sections: { code: string; label: string; hint: string; items: Card[] }[] = grouped
    ? TIERS.map((t) => ({ ...t, items: items.filter((p) => p.tier === t.code) })).filter((s) => s.items.length)
    : [{ code: 'all', label: '', hint: '', items }];

  return (
    <div className="container-page py-10">
      <form role="search" action="/shop" className="mb-6 flex max-w-xl gap-2">
        <label htmlFor="shop-search" className="sr-only">Search products</label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input id="shop-search" name="q" type="search" defaultValue={q} maxLength={60} placeholder="Search by name, brand, or feature" className="input pl-9" />
        </div>
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {tier ? <input type="hidden" name="tier" value={tier} /> : null}
        {sort !== 'featured' ? <input type="hidden" name="sort" value={sort} /> : null}
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
      {q ? (
        <p className="-mt-3 mb-5 text-sm text-ink-soft">
          Results for <span className="font-semibold text-foreground">“{q}”</span> · <Link href={href({ q: undefined })} className="font-semibold text-brand hover:underline">Clear search</Link>
        </p>
      ) : null}
      <PageHeader
        title={tierInfo ? `${tierInfo.label} ${category ? CATEGORIES.find((c) => c.code === category)!.short.toLowerCase() : 'rides'}` : categoryName}
        subtitle={tierInfo ? `${tierInfo.hint}. ${items.length} product${items.length === 1 ? '' : 's'}.` : `${items.length} product${items.length === 1 ? '' : 's'}, from entry level to high-end.`}
      />

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Category">
        {[{ code: undefined, short: 'All rides' }, ...CATEGORIES].map((c) => (
          <Link key={c.code ?? 'all'} href={href({ category: c.code })} aria-current={category === c.code ? 'page' : undefined}
            className={cn('btn btn-sm', category === c.code ? 'btn-primary' : 'btn-outline')}>
            {c.short}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tier">
          {[{ code: undefined, label: 'All tiers' }, ...TIERS].map((t) => (
            <Link key={t.code ?? 'all'} href={href({ tier: t.code })} aria-current={tier === t.code ? 'page' : undefined}
              className={cn('rounded-full border px-3 py-1.5 text-sm', tier === t.code ? 'border-night bg-night font-semibold text-volt' : 'border-border text-ink-soft hover:text-foreground')}>
              {t.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-sm" role="group" aria-label="Sort">
          {SORTS.map((s) => (
            <Link key={s.key} href={href({ sort: s.key })} aria-current={sort === s.key ? 'true' : undefined}
              className={cn('rounded-lg px-2.5 py-1.5', sort === s.key ? 'bg-surface-soft font-semibold text-foreground' : 'text-ink-soft hover:text-foreground')}>
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title={q ? `No matches for “${q}”.` : 'No products here yet.'}
            hint={q ? 'Check the spelling, use fewer words, or clear the filters.' : 'Try another tier or category.'}
            action={<Link href="/shop" className="btn btn-outline">Show all products</Link>}
          />
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.code} aria-label={s.label || undefined}>
              {s.label ? (
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                  <h2 className="text-lg font-bold">{s.label} <span className="text-sm font-normal text-ink-soft">· {s.hint}</span></h2>
                  <Link href={href({ tier: s.code })} className="text-sm font-semibold text-brand hover:underline">See only {s.label.toLowerCase()}</Link>
                </div>
              ) : null}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {s.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
