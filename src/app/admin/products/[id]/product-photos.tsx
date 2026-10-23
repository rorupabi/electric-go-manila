'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

const MAX = 6;

export function ProductPhotos({ productId, initial }: { productId: string; initial: { id: string; url: string }[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    const room = MAX - photos.length;
    if (room <= 0) { setError('Maximum 6 photos per product.'); return; }
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, room)) {
        const sign = await fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'product', entityId: productId, contentType: file.type, size: file.size }),
        });
        const signed = await sign.json().catch(() => ({}));
        if (!sign.ok) { setError(apiErrorMessage(signed, 'Could not start the upload.')); return; }
        const put = await fetch(signed.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        if (!put.ok) { setError('Could not upload that photo. Try again.'); return; }
        const commit = await fetch('/api/uploads/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'product', entityId: productId, bucket: signed.bucket, path: signed.path }),
        });
        const committed = await commit.json().catch(() => ({}));
        if (!commit.ok) { setError(apiErrorMessage(committed, 'Could not save that photo.')); return; }
        setPhotos((prev) => [...prev, committed.photo]);
      }
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function act(photoId: string, method: 'PATCH' | 'DELETE') {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/photos/${photoId}`, { method });
      if (!res.ok) { setError(apiErrorMessage(await res.json().catch(() => ({})), 'Could not update that photo.')); return; }
      setPhotos((prev) => method === 'DELETE'
        ? prev.filter((p) => p.id !== photoId)
        : [...prev.filter((p) => p.id === photoId), ...prev.filter((p) => p.id !== photoId)]);
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Photos <span className="text-sm font-normal text-ink-soft">({photos.length}/{MAX}, first is the cover)</span></h2>
        {busy ? <span className="flex items-center gap-2 text-sm text-ink-soft"><Spinner /> Working…</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {photos.map((p, i) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-soft">
            <Image src={p.url} alt={`Photo ${i + 1}`} fill sizes="200px" className="object-cover" />
            {i === 0 ? <span className="badge absolute left-2 top-2 bg-volt text-night">Cover</span> : null}
            <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
              {i > 0 ? (
                <button type="button" onClick={() => act(p.id, 'PATCH')} disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg bg-white/90 shadow" aria-label="Make cover photo"><Star className="h-4 w-4" aria-hidden /></button>
              ) : null}
              <button type="button" onClick={() => act(p.id, 'DELETE')} disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-red-700 shadow" aria-label="Delete photo"><Trash2 className="h-4 w-4" aria-hidden /></button>
            </div>
          </div>
        ))}
        {photos.length < MAX && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-center text-sm text-ink-soft hover:border-brand hover:text-brand">
            <span className="flex flex-col items-center gap-1"><ImagePlus className="h-6 w-6" aria-hidden />Add photos</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <p className="text-xs text-ink-soft">JPG, PNG or WebP up to 6 MB. Photos are resized and compressed automatically.</p>
      <FormError message={error} />
    </section>
  );
}
