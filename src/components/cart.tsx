'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export type CartLine = { productId: string; quantity: number };

const KEY = 'egm-cart-v1';
export const MAX_QTY = 10;
const EMPTY: CartLine[] = [];

// A tiny external store over localStorage, so React reads it with useSyncExternalStore
// (no setState-in-effect) and other tabs stay in sync through the storage event.
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    cache = Array.isArray(parsed)
      ? parsed.filter((l) => typeof l?.productId === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0)
      : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: CartLine[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: cart lasts for this tab only */ }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { cache = null; listener(); }
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}

const noopSubscribe = () => () => {};

type CartApi = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

/** Cart lives in this browser only; prices and stock are always re-checked by the server. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  // False during server render and hydration, true once the browser cart has been read.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const api = useMemo<CartApi>(() => ({
    lines,
    ready,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    add: (productId, quantity = 1) => {
      const prev = read();
      const found = prev.find((l) => l.productId === productId);
      write(found
        ? prev.map((l) => l.productId === productId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l)
        : [...prev, { productId, quantity: Math.min(MAX_QTY, quantity) }]);
    },
    setQuantity: (productId, quantity) => write(read().map((l) =>
      l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l)),
    remove: (productId) => write(read().filter((l) => l.productId !== productId)),
    clear: () => write(EMPTY),
  }), [lines, ready]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-xl hover:bg-surface-soft" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
      <ShoppingBag className="h-5 w-5" aria-hidden />
      {count > 0 && (
        <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
