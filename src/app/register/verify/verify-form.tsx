'use client';

import { useState } from 'react';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

export function VerifyForm({ email: initialEmail, next }: { email: string; next: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function post(url: string, body: object) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { res, json: await res.json().catch(() => ({})) };
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const token = String(new FormData(e.currentTarget).get('token') ?? '');
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { res, json } = await post('/api/auth/verify', { email, token });
      if (!res.ok) { setError(apiErrorMessage(json, 'Could not confirm that code.')); setBusy(false); return; }
      window.location.href = next;
    } catch {
      setError(NETWORK_ERROR);
      setBusy(false);
    }
  }

  async function resend() {
    if (resending || !email) return;
    setResending(true);
    setError(null);
    try {
      const { res, json } = await post('/api/auth/resend', { email });
      if (!res.ok) setError(apiErrorMessage(json, 'Could not send a new code.'));
      else setNotice('A new code is on its way. It can take a minute to arrive.');
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {!initialEmail && (
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="token">Code</label>
        <input id="token" name="token" className="input text-center text-lg tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={10} required />
      </div>
      <FormError message={error} />
      {notice ? <p className="text-sm text-green-800">{notice}</p> : null}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : null} Confirm</button>
      <button type="button" onClick={resend} disabled={resending || !email} className="btn w-full text-brand">
        {resending ? <Spinner /> : null} Send a new code
      </button>
    </form>
  );
}
