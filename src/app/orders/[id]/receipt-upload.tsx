'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

export function ReceiptUpload({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const sign = await fetch('/api/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'receipt', entityId: orderId, contentType: file.type, size: file.size }),
      });
      const signed = await sign.json().catch(() => ({}));
      if (!sign.ok) { setError(apiErrorMessage(signed, 'Could not start the upload.')); return; }
      const put = await fetch(signed.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) { setError('Could not upload that file. Try again.'); return; }
      const commit = await fetch('/api/uploads/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'receipt', entityId: orderId, bucket: signed.bucket, path: signed.path, referenceNumber: reference || undefined }),
      });
      const committed = await commit.json().catch(() => ({}));
      if (!commit.ok) { setError(apiErrorMessage(committed, 'Could not save your receipt.')); return; }
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-surface-soft p-4">
      <div>
        <label className="label" htmlFor="receipt">Receipt screenshot or PDF (max 5 MB)</label>
        <input id="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:font-semibold file:text-white" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div>
        <label className="label" htmlFor="reference">Reference number <span className="font-normal">(optional)</span></label>
        <input id="reference" className="input" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} placeholder="e.g. 1234 567 891011" />
      </div>
      <FormError message={error} />
      <button type="button" onClick={submit} disabled={!file || busy} className="btn btn-primary">
        {busy ? <Spinner /> : <Upload className="h-4 w-4" aria-hidden />} {busy ? 'Uploading…' : 'Submit receipt'}
      </button>
    </div>
  );
}
