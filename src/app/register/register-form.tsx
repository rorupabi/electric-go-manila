'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormError, Spinner } from '@/components/ui';
import { apiErrorMessage, NETWORK_ERROR, PASSWORD_HINT, passwordOk } from '@/lib/utils';

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!passwordOk(password)) { setError(PASSWORD_HINT); return; }
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(f.get('name') ?? ''), email, phone: String(f.get('phone') ?? ''), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiErrorMessage(json, 'Could not create your account.'));
        setBusy(false);
        return;
      }
      if (json.needsCode === false) { window.location.href = next; return; }
      router.push(`/register/verify?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
    } catch {
      setError(NETWORK_ERROR);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" className="input" autoComplete="name" required maxLength={100} />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="phone">Mobile number</label>
        <input id="phone" name="phone" className="input" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" required maxLength={20} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" className="input" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-hint" />
        <p id="password-hint" className={`mt-1 text-xs ${password && !passwordOk(password) ? 'text-amber-700' : 'text-ink-soft'}`}>{PASSWORD_HINT}</p>
      </div>
      <FormError message={error} />
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : null} Create account</button>
    </form>
  );
}
