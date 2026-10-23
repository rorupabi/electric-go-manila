'use client';

import { useState } from 'react';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR } from '@/lib/utils';

export function LoginForm({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '');
    setBusy(true);
    setError(null);
    setUnconfirmedEmail(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: String(f.get('password') ?? '') }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiErrorMessage(json, 'Could not sign you in.'));
        if (json.error === 'email_not_confirmed') setUnconfirmedEmail(email);
        setBusy(false);
        return;
      }
      // Full navigation so the header and every server component see the new session.
      window.location.href = next;
    } catch {
      setError(NETWORK_ERROR);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <FormError message={error} />
      {unconfirmedEmail ? (
        <a href={`/register/verify?email=${encodeURIComponent(unconfirmedEmail)}`} className="block text-sm font-semibold text-brand hover:underline">Enter your email code</a>
      ) : null}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : null} Sign in</button>
    </form>
  );
}
