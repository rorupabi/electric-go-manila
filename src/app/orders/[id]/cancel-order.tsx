'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

export function CancelOrder({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (busy || !confirm('Cancel this order? Your reserved items will be released.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      if (!res.ok) { setError(apiErrorMessage(await res.json().catch(() => ({})), 'Could not cancel this order.')); return; }
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <FormError message={error} />
      <button type="button" onClick={cancel} disabled={busy} className="btn btn-danger btn-sm w-full">
        {busy ? <Spinner /> : null} Cancel order
      </button>
    </div>
  );
}
