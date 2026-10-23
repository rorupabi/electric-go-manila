import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';
import { categoryLabel, getProductBySlug, tierLabel } from '@/lib/catalog';
import type { ProductSpecs } from '@/lib/db/schema';
import { formatPHP } from '@/lib/utils';
import { Gallery } from './gallery';
import { AddToCart } from './add-to-cart';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug).catch(() => null);
  return { title: product ? product.name : 'Product not found' };
}

const SPEC_ROWS: { key: keyof ProductSpecs; label: string; unit?: string }[] = [
  { key: 'rangeKm', label: 'Range per charge', unit: 'km' },
  { key: 'topSpeedKph', label: 'Top speed', unit: 'km/h' },
  { key: 'motorW', label: 'Motor', unit: 'W' },
  { key: 'batteryWh', label: 'Battery', unit: 'Wh' },
  { key: 'chargeHours', label: 'Charging time', unit: 'hours' },
  { key: 'weightKg', label: 'Weight', unit: 'kg' },
  { key: 'maxLoadKg', label: 'Max rider load', unit: 'kg' },
  { key: 'wheelSize', label: 'Wheels' },
];

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const specs = SPEC_ROWS.filter((r) => product.specs[r.key] !== undefined && product.specs[r.key] !== '');

  return (
    <div className="container-page py-8">
      <Link href={`/shop?category=${product.category}&tier=${product.tier}`} className="mb-5 inline-flex min-h-11 items-center gap-1 text-sm text-ink-soft hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden /> {categoryLabel(product.category)} · {tierLabel(product.tier)}
      </Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <Gallery photos={product.photos} name={product.name} category={product.category} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{product.brand} · {tierLabel(product.tier)}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatPHP(product.pricePhp)}</span>
            {product.compareAtPhp ? <span className="text-lg text-ink-soft line-through">{formatPHP(product.compareAtPhp)}</span> : null}
          </div>
          <p className="mt-2 text-sm">
            {product.stock > 5 ? <span className="badge badge-green">In stock</span>
              : product.stock > 0 ? <span className="badge badge-amber">Only {product.stock} left</span>
              : <span className="badge badge-gray">Sold out</span>}
          </p>
          <div className="mt-6">
            <AddToCart productId={product.id} stock={product.stock} />
          </div>
          {product.description ? (
            <div className="mt-8 space-y-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{product.description}</div>
          ) : null}
          {specs.length > 0 && (
            <div className="card mt-8 overflow-hidden">
              <h2 className="border-b border-border px-4 py-3 font-semibold">Specifications</h2>
              <dl className="divide-y divide-border text-sm">
                {specs.map((r) => (
                  <div key={r.key} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-ink-soft">{r.label}</dt>
                    <dd className="font-medium">{String(product.specs[r.key])}{r.unit ? ` ${r.unit}` : ''}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <p className="mt-4 text-xs text-ink-soft">Range and speed vary with rider weight, terrain, and riding mode.</p>
        </div>
      </div>
    </div>
  );
}
