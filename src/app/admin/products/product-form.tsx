'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, TIERS, type ProductSpecs } from '@/lib/db/schema';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

type Initial = {
  id: string;
  name: string;
  brand: string;
  category: string;
  tier: string;
  pricePhp: number;
  compareAtPhp: number | null;
  stock: number;
  description: string;
  status: string;
  featured: boolean;
  specs: ProductSpecs;
};

const SPEC_FIELDS: { key: Exclude<keyof ProductSpecs, 'wheelSize'>; label: string }[] = [
  { key: 'rangeKm', label: 'Range (km)' },
  { key: 'topSpeedKph', label: 'Top speed (km/h)' },
  { key: 'motorW', label: 'Motor (W)' },
  { key: 'batteryWh', label: 'Battery (Wh)' },
  { key: 'chargeHours', label: 'Charge time (hours)' },
  { key: 'weightKg', label: 'Weight (kg)' },
  { key: 'maxLoadKg', label: 'Max load (kg)' },
];

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim();
  return s === '' ? undefined : Number(s);
};

export function ProductForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const specs: ProductSpecs = { wheelSize: String(f.get('wheelSize') ?? '').trim() || undefined };
    for (const s of SPEC_FIELDS) specs[s.key] = num(f.get(s.key));
    const body = {
      name: String(f.get('name') ?? ''),
      brand: String(f.get('brand') ?? ''),
      category: String(f.get('category') ?? ''),
      tier: String(f.get('tier') ?? 'entry'),
      pricePhp: num(f.get('pricePhp')),
      compareAtPhp: num(f.get('compareAtPhp')) ?? null,
      stock: num(f.get('stock')) ?? 0,
      description: String(f.get('description') ?? ''),
      status: f.get('status') === 'active' ? 'active' : 'draft',
      featured: f.get('featured') === 'on',
      specs,
    };
    setBusy('save');
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : '/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(apiErrorMessage(json, 'Could not save this product.')); return; }
      if (!isEdit) { router.push(`/admin/products/${json.id}`); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!initial || busy || !confirm(`Delete "${initial.name}" and its photos? This cannot be undone.`)) return;
    setBusy('delete');
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${initial.id}`, { method: 'DELETE' });
      if (!res.ok) { setError(apiErrorMessage(await res.json().catch(() => ({})), 'Could not delete this product.')); return; }
      router.push('/admin/products');
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-6 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Product name</label>
          <input id="name" name="name" className="input" required maxLength={120} defaultValue={initial?.name} placeholder="e.g. Urban 350 Foldable Kick Scooter" />
        </div>
        <div>
          <label className="label" htmlFor="brand">Brand</label>
          <input id="brand" name="brand" className="input" required maxLength={80} defaultValue={initial?.brand} />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" className="input" defaultValue={initial?.category ?? 'kick_scooter'}>
            {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="tier">Tier</label>
          <select id="tier" name="tier" className="input" defaultValue={initial?.tier ?? 'entry'}>
            {TIERS.map((t) => <option key={t.code} value={t.code}>{t.label}: {t.hint}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pricePhp">Price (₱)</label>
          <input id="pricePhp" name="pricePhp" type="number" inputMode="numeric" min={1} step={1} className="input" required defaultValue={initial?.pricePhp} />
        </div>
        <div>
          <label className="label" htmlFor="compareAtPhp">Was price (₱) <span className="font-normal">(optional, shows a sale)</span></label>
          <input id="compareAtPhp" name="compareAtPhp" type="number" inputMode="numeric" min={1} step={1} className="input" defaultValue={initial?.compareAtPhp ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="stock">Units in stock</label>
          <input id="stock" name="stock" type="number" inputMode="numeric" min={0} step={1} className="input" required defaultValue={initial?.stock ?? 0} />
        </div>
        <div>
          <label className="label" htmlFor="status">Visibility</label>
          <select id="status" name="status" className="input" defaultValue={initial?.status ?? 'draft'}>
            <option value="active">Live (customers can buy)</option>
            <option value="draft">Draft (hidden)</option>
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured} className="h-4 w-4 accent-[var(--brand)]" />
          Feature on the home page
        </label>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" className="input min-h-32" maxLength={4000} defaultValue={initial?.description} placeholder="Who it is for, what makes it good, what is in the box." />
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 font-semibold">Specifications <span className="text-sm font-normal text-ink-soft">(optional, leave blank to hide)</span></legend>
        <div className="grid gap-4 sm:grid-cols-4">
          {SPEC_FIELDS.map((s) => (
            <div key={s.key}>
              <label className="label" htmlFor={s.key}>{s.label}</label>
              <input id={s.key} name={s.key} type="number" inputMode="decimal" min={0} step="any" className="input" defaultValue={initial?.specs[s.key] ?? ''} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="wheelSize">Wheels</label>
            <input id="wheelSize" name="wheelSize" className="input" maxLength={40} defaultValue={initial?.specs.wheelSize ?? ''} placeholder='e.g. 10" pneumatic' />
          </div>
        </div>
      </fieldset>

      <FormError message={error} />
      {saved && !error ? <p className="text-sm text-green-800">Changes saved.</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy !== null}>{busy === 'save' ? <Spinner /> : null} {isEdit ? 'Save changes' : 'Save and add photos'}</button>
        {isEdit ? <button type="button" onClick={remove} className="btn btn-danger ml-auto" disabled={busy !== null}>{busy === 'delete' ? <Spinner /> : null} Delete product</button> : null}
      </div>
    </form>
  );
}
