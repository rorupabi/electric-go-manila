'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { MAX_QTY, useCart } from '@/components/cart';
import { useCartQuote } from '@/components/use-cart-quote';
import { ProductImage } from '@/components/product-image';
import { EmptyState, Spinner } from '@/components/ui';
import { formatPHP } from '@/lib/utils';

export function CartView() {
  const { setQuantity, remove } = useCart();
  const { quoted, subtotal, blocked, loading, error } = useCartQuote();

  if (loading && quoted.length === 0) {
    return <div className="card flex items-center justify-center gap-2 p-12 text-sm text-ink-soft"><Spinner /> Loading your cart…</div>;
  }
  if (quoted.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Your cart is empty." hint="Find a scooter or e-bike that fits your commute." action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ul className="card divide-y divide-border">
        {quoted.map((l) => (
          <li key={l.productId} className="flex gap-4 p-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-soft">
              <ProductImage src={l.product?.cover ?? null} alt={l.product?.name ?? 'Product'} category={l.product?.category ?? ''} sizes="96px" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {l.product ? (
                <Link href={`/products/${l.product.slug}`} className="font-semibold hover:text-brand">{l.product.name}</Link>
              ) : (
                <span className="font-semibold text-ink-soft">Unavailable product</span>
              )}
              {l.product ? <span className="text-sm text-ink-soft">{formatPHP(l.product.pricePhp)} each</span> : null}
              {l.problem ? <span role="alert" className="text-sm text-red-700">{l.problem}</span> : null}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="inline-flex items-center rounded-lg border border-border" role="group" aria-label="Quantity">
                  <button type="button" className="grid h-9 w-9 place-items-center disabled:opacity-40" onClick={() => setQuantity(l.productId, l.quantity - 1)} disabled={l.quantity <= 1} aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" aria-hidden /></button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.quantity}</span>
                  <button type="button" className="grid h-9 w-9 place-items-center disabled:opacity-40" onClick={() => setQuantity(l.productId, l.quantity + 1)} disabled={l.quantity >= Math.min(MAX_QTY, l.product?.stock ?? 0)} aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" aria-hidden /></button>
                </div>
                <div className="flex items-center gap-3">
                  {l.product ? <span className="font-semibold">{formatPHP(l.product.pricePhp * l.quantity)}</span> : null}
                  <button type="button" onClick={() => remove(l.productId)} className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-700" aria-label="Remove from cart"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="card h-fit space-y-4 p-5">
        <div className="flex justify-between text-sm"><span className="text-ink-soft">Subtotal</span><span className="font-semibold">{formatPHP(subtotal)}</span></div>
        <p className="text-xs text-ink-soft">Delivery fee (if any) is added at checkout.</p>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        {blocked || error || loading ? (
          <button type="button" className="btn btn-primary w-full" disabled>{loading ? 'Checking prices…' : 'Fix your cart to continue'}</button>
        ) : (
          <Link href="/checkout" className="btn btn-primary w-full">Check out</Link>
        )}
        <Link href="/shop" className="block text-center text-sm text-brand hover:underline">Continue shopping</Link>
      </aside>
    </div>
  );
}
