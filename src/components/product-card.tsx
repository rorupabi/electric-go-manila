import Link from 'next/link';
import { Battery, Gauge } from 'lucide-react';
import type { ProductCard as Card } from '@/lib/catalog';
import { categoryLabel, tierLabel } from '@/lib/catalog';
import { formatPHP } from '@/lib/utils';
import { ProductImage } from './product-image';

export function ProductCard({ product }: { product: Card }) {
  const soldOut = product.stock <= 0;
  const off = product.compareAtPhp ? Math.round((1 - product.pricePhp / product.compareAtPhp) * 100) : 0;
  return (
    <Link href={`/products/${product.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-surface-soft">
        <ProductImage src={product.cover} alt={product.name} category={product.category} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className={`badge ${product.tier === 'high' ? 'bg-night text-volt' : product.tier === 'mid' ? 'bg-brand text-white' : 'bg-white/90 text-foreground'}`}>{tierLabel(product.tier)}</span>
          {soldOut ? <span className="badge badge-gray">Sold out</span> : off > 0 ? <span className="badge bg-volt text-night">{off}% off</span> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{categoryLabel(product.category, true)} · {product.brand}</p>
        <h3 className="font-semibold leading-snug group-hover:text-brand">{product.name}</h3>
        <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
          {product.specs.rangeKm ? <span className="inline-flex items-center gap-1"><Battery className="h-3.5 w-3.5" aria-hidden />{product.specs.rangeKm} km range</span> : null}
          {product.specs.topSpeedKph ? <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" aria-hidden />{product.specs.topSpeedKph} km/h</span> : null}
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold">{formatPHP(product.pricePhp)}</span>
          {product.compareAtPhp ? <span className="text-sm text-ink-soft line-through">{formatPHP(product.compareAtPhp)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
