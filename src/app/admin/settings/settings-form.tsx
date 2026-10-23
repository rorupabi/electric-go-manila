'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

type Settings = { gcashName: string; gcashNumber: string; mayaName: string; mayaNumber: string; bankName: string; bankAccountName: string; bankAccountNumber: string; pickupAddress: string; deliveryFeePhp: number };

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? '').trim();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gcashName: text('gcashName'), gcashNumber: text('gcashNumber'), mayaName: text('mayaName'),
          mayaNumber: text('mayaNumber'), bankName: text('bankName'), bankAccountName: text('bankAccountName'),
          bankAccountNumber: text('bankAccountNumber'), pickupAddress: text('pickupAddress'), deliveryFeePhp: Number(text('deliveryFeePhp') || 0),
        }),
      });
      if (!res.ok) { setError(apiErrorMessage(await res.json().catch(() => ({})), 'Could not save settings.')); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  const field = (name: keyof Settings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" defaultValue={initial[name]} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="card max-w-2xl space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {field('gcashName', 'GCash account name', { maxLength: 100 })}
        {field('gcashNumber', 'GCash number', { maxLength: 20, inputMode: 'tel' })}
        {field('mayaName', 'Maya account name', { maxLength: 100 })}
        {field('mayaNumber', 'Maya number', { maxLength: 20, inputMode: 'tel' })}
      </div>
      <fieldset className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">Bank transfer</legend>
        {field('bankName', 'Bank', { maxLength: 60, placeholder: 'BPI' })}
        {field('bankAccountNumber', 'Account number', { maxLength: 30, inputMode: 'numeric', placeholder: 'e.g. 1234 5678 90' })}
        <div className="sm:col-span-2">{field('bankAccountName', 'Account name', { maxLength: 100 })}</div>
      </fieldset>
      <div>
        <label className="label" htmlFor="pickupAddress">Pickup address</label>
        <textarea id="pickupAddress" name="pickupAddress" className="input" defaultValue={initial.pickupAddress} maxLength={500} placeholder="Shop address and landmarks" />
      </div>
      {field('deliveryFeePhp', 'Delivery fee within Metro Manila (₱)', { type: 'number', min: 0, step: 1, inputMode: 'numeric' })}
      <FormError message={error} />
      {saved && !error ? <p className="text-sm text-green-800">Changes saved.</p> : null}
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : null} Save settings</button>
    </form>
  );
}
