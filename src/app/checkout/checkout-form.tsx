'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Truck } from 'lucide-react';
import { useCart } from '@/components/cart';
import { useCartQuote } from '@/components/use-cart-quote';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, cn, formatPHP, NETWORK_ERROR } from '@/lib/utils';

export function CheckoutForm({ defaults, deliveryFeePhp, pickupAddress }: {
  defaults: { name: string; phone: string };
  deliveryFeePhp: number;
  pickupAddress: string | null;
}) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const { quoted, subtotal, blocked, loading, error: quoteError } = useCartQuote();
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const fee = fulfillment === 'delivery' ? deliveryFeePhp : 0;

  // The cart is cleared right after ordering; keep this message up while the order page loads.
  if (placed) {
    return <div className="card flex items-center justify-center gap-2 p-12 text-sm"><Spinner /> Order placed. Opening your order…</div>;
  }
  if (!loading && lines.length === 0) {
    return <div className="card p-8 text-center"><p className="font-semibold">Your cart is empty.</p><Link href="/shop" className="btn btn-primary mt-4">Start shopping</Link></div>;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines,
          fulfillment,
          contactName: String(f.get('contactName') ?? ''),
          contactPhone: String(f.get('contactPhone') ?? ''),
          address: fulfillment === 'delivery' ? String(f.get('address') ?? '') : undefined,
          notes: String(f.get('notes') ?? '') || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiErrorMessage(json, 'Could not place your order.'));
        setBusy(false);
        if (json.error === 'unauthenticated') router.push('/login?next=/checkout');
        return;
      }
      setPlaced(true);
      clear();
      router.push(`/orders/${json.order.id}?placed=1`);
    } catch {
      setError(NETWORK_ERROR);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <fieldset className="card p-5">
          <legend className="px-1 font-semibold">How do you want to get it?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([
              { v: 'pickup', icon: Store, title: 'Pick up at our shop', body: pickupAddress ?? 'Address shown after you order.', price: 'Free' },
              { v: 'delivery', icon: Truck, title: 'Deliver to me', body: 'Within Metro Manila.', price: formatPHP(deliveryFeePhp) },
            ] as const).map(({ v, icon: Icon, title, body, price }) => (
              <label key={v} className={cn('flex cursor-pointer gap-3 rounded-xl border p-4', fulfillment === v ? 'border-brand bg-brand/5' : 'border-border')}>
                <input type="radio" name="fulfillment" value={v} checked={fulfillment === v} onChange={() => setFulfillment(v)} className="mt-1 accent-[var(--brand)]" />
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" aria-hidden />{title}</span>
                  <span className="mt-1 block text-sm text-ink-soft">{body}</span>
                  <span className="mt-1 block text-sm font-semibold">{price}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="card grid gap-4 p-5 sm:grid-cols-2">
          <legend className="px-1 font-semibold">Contact</legend>
          <div>
            <label className="label" htmlFor="contactName">Name for this order</label>
            <input id="contactName" name="contactName" className="input" defaultValue={defaults.name} autoComplete="name" required maxLength={100} />
          </div>
          <div>
            <label className="label" htmlFor="contactPhone">Mobile number</label>
            <input id="contactPhone" name="contactPhone" className="input" defaultValue={defaults.phone ? `0${defaults.phone}` : ''} inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" required maxLength={20} />
          </div>
          {fulfillment === 'delivery' && (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Delivery address</label>
              <textarea id="address" name="address" className="input" autoComplete="street-address" placeholder="House no., street, barangay, city" required maxLength={500} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">Notes <span className="font-normal">(optional)</span></label>
            <textarea id="notes" name="notes" className="input" placeholder="Landmarks, preferred pickup time, etc." maxLength={500} />
          </div>
        </fieldset>
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {quoted.map((l) => (
            <li key={l.productId} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{l.product?.name ?? 'Unavailable'} × {l.quantity}</span>
              <span className="shrink-0">{l.product ? formatPHP(l.product.pricePhp * l.quantity) : '—'}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{formatPHP(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><span>{fee ? formatPHP(fee) : 'Free'}</span></div>
          <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{formatPHP(subtotal + fee)}</span></div>
        </div>
        <p className="text-xs text-ink-soft">After you place the order, pay by GCash, Maya, or bank transfer (BPI) and upload your receipt on the order page. We hold your items while you pay.</p>
        <FormError message={error ?? quoteError} />
        {blocked ? <p className="text-sm text-red-700">Some items changed. <Link href="/cart" className="underline">Review your cart</Link>.</p> : null}
        <button type="submit" className="btn btn-primary w-full" disabled={busy || loading || blocked || Boolean(quoteError)}>
          {busy ? <Spinner /> : null} {busy ? 'Placing order…' : 'Place order'}
        </button>
      </aside>
    </form>
  );
}
