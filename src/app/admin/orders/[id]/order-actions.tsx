'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Fulfillment, OrderStatus } from '@/lib/db/schema';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

type Action = 'approve_payment' | 'reject_payment' | 'mark_ready' | 'mark_completed' | 'cancel';

export function OrderActions({ orderId, status, fulfillment }: { orderId: string; status: OrderStatus; fulfillment: Fulfillment }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    if (busy) return;
    if ((action === 'reject_payment' || action === 'cancel') && reason.trim().length < 3) {
      setError('Add a reason so the customer knows what happened.');
      return;
    }
    if (action === 'cancel' && !confirm('Cancel this order and put its items back in stock?')) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason.trim() || undefined }),
      });
      if (!res.ok) { setError(apiErrorMessage(await res.json().catch(() => ({})), 'Could not update this order.')); return; }
      setReason('');
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(null);
    }
  }

  const needsReason = status === 'payment_review' || ['awaiting_payment', 'paid'].includes(status);
  if (status === 'completed' || status === 'cancelled') return null;

  const btn = (action: Action, label: string, variant = 'btn-primary') => (
    <button type="button" onClick={() => run(action)} disabled={busy !== null} className={`btn ${variant} w-full`}>
      {busy === action ? <Spinner /> : null} {label}
    </button>
  );

  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-semibold">Next step</h2>
      {status === 'awaiting_payment' && <p className="text-sm text-ink-soft">Waiting for the customer to pay and upload a receipt.</p>}
      {status === 'payment_review' && <p className="text-sm text-ink-soft">Check the receipt against your GCash, Maya, or BPI history before approving.</p>}
      {status === 'payment_review' && btn('approve_payment', 'Approve payment')}
      {status === 'paid' && btn('mark_ready', fulfillment === 'delivery' ? 'Mark out for delivery' : 'Mark ready for pickup')}
      {status === 'ready' && btn('mark_completed', fulfillment === 'delivery' ? 'Mark delivered' : 'Mark picked up')}
      {needsReason && (
        <div className="space-y-2 border-t border-border pt-3">
          <label className="label" htmlFor="reason">Reason (for rejecting or cancelling)</label>
          <textarea id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Amount does not match the total" />
          {status === 'payment_review' && btn('reject_payment', 'Reject receipt', 'btn-outline')}
          {btn('cancel', 'Cancel order', 'btn-danger')}
        </div>
      )}
      <FormError message={error} />
    </section>
  );
}
