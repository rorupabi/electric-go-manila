'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from './cart';
import { NETWORK_ERROR } from '@/lib/utils';

export type QuotedProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  pricePhp: number;
  stock: number;
  cover: string | null;
};

export type QuotedLine = { productId: string; quantity: number; product: QuotedProduct | null; problem: string | null };

type Result = { key: string; products: Record<string, QuotedProduct>; error: string | null };

/** Joins the browser cart with live prices and stock from the server. */
export function useCartQuote() {
  const { lines, ready } = useCart();
  const key = useMemo(() => lines.map((l) => l.productId).sort().join(','), [lines]);
  const [result, setResult] = useState<Result>({ key: '', products: {}, error: null });

  useEffect(() => {
    if (!ready || !key) return;
    let live = true;
    fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: key.split(',') }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('quote failed'))))
      .then((j: { products: QuotedProduct[] }) => {
        if (live) setResult({ key, products: Object.fromEntries(j.products.map((p) => [p.id, p])), error: null });
      })
      .catch(() => { if (live) setResult({ key, products: {}, error: NETWORK_ERROR }); });
    return () => { live = false; };
  }, [key, ready]);

  // A result is only trusted for the exact set of products it was fetched for.
  const current = result.key === key;
  const loading = !ready || (key !== '' && !current);
  const products = current ? result.products : {};
  const error = current ? result.error : null;

  const quoted: QuotedLine[] = lines.map((l) => {
    const product = products[l.productId] ?? null;
    const problem = loading || error ? null
      : !product ? 'No longer available. Remove it to continue.'
      : product.stock <= 0 ? 'Sold out. Remove it to continue.'
      : product.stock < l.quantity ? `Only ${product.stock} left. Lower the quantity to continue.`
      : null;
    return { ...l, product, problem };
  });
  const subtotal = quoted.reduce((s, l) => s + (l.product ? l.product.pricePhp * l.quantity : 0), 0);
  const blocked = quoted.some((l) => l.problem);
  return { quoted, subtotal, blocked, loading, error };
}
