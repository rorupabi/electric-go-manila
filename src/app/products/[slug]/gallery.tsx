'use client';

import { useState } from 'react';
import { ProductImage } from '@/components/product-image';
import { cn } from '@/lib/utils';

export function Gallery({ photos, name, category }: { photos: { id: string; url: string }[]; name: string; category: string }) {
  const [active, setActive] = useState(0);
  const current = photos[active]?.url ?? null;
  return (
    <div>
      <div className="card relative aspect-[4/3] overflow-hidden">
        <ProductImage src={current} alt={name} category={category} sizes="(min-width: 1024px) 50vw, 100vw" priority />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${photos.length}`}
              aria-pressed={i === active}
              className={cn('relative aspect-square overflow-hidden rounded-lg border-2', i === active ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100')}
            >
              <ProductImage src={p.url} alt="" category={category} sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
