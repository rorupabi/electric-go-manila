'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from './ui';

export function LogoutButton({ block = false }: { block?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Even if the request fails, leave the account pages; the session cookie expires on its own.
    }
    router.push('/');
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={block ? 'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-soft' : 'btn btn-outline btn-sm'}
    >
      {busy ? <Spinner /> : null} Sign out
    </button>
  );
}
