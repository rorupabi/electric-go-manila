'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { MAX_QTY, useCart } from '@/components/cart';

export function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const { add, lines } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.productId === productId)?.quantity ?? 0;
  const max = Math.max(0, Math.min(MAX_QTY, stock) - inCart);

  if (stock <= 0) return <button type="button" className="btn btn-outline w-full sm:w-auto" disabled>Sold out</button>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-xl border border-border bg-surface" role="group" aria-label="Quantity">
          <button type="button" className="grid h-11 w-11 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" className="grid h-11 w-11 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase quantity">
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className="btn btn-primary flex-1 sm:flex-none"
          disabled={max === 0}
          onClick={() => { add(productId, Math.min(qty, max)); setAdded(true); setQty(1); }}
        >
          {added ? <Check className="h-4 w-4" aria-hidden /> : <ShoppingBag className="h-4 w-4" aria-hidden />}
          {added ? 'Added to cart' : 'Add to cart'}
        </button>
      </div>
      {max === 0 && inCart > 0 ? <p className="text-sm text-ink-soft">You already have the most we can sell of this item in your cart.</p> : null}
      {added ? <Link href="/cart" className="inline-block text-sm font-semibold text-brand hover:underline">View cart and check out →</Link> : null}
    </div>
  );
}
