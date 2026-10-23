'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

const SUGGESTIONS = ['foldable', 'long range', 'seat', 'cargo', 'mountain'];

/** Header search: a button that opens a search box and goes to /shop?q=… */
export function SearchButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => { if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  function go(term: string) {
    const q = term.trim();
    setOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  }

  return (
    <div ref={panel} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Search products"
        aria-expanded={open}
        className="grid h-11 w-11 place-items-center rounded-xl hover:bg-surface-soft"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Search className="h-5 w-5" aria-hidden />}
      </button>
      {open && (
        <div className="card fixed inset-x-4 top-[4.25rem] z-50 p-3 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <form role="search" onSubmit={(e) => { e.preventDefault(); go(String(new FormData(e.currentTarget).get('q') ?? '')); }}>
            <label htmlFor="header-search" className="sr-only">Search scooters and e-bikes</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
                <input ref={input} id="header-search" name="q" type="search" maxLength={60} autoComplete="off" placeholder="Search scooters and e-bikes" className="input pl-9" />
              </div>
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink-soft">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => go(s)} className="rounded-full border border-border px-2.5 py-1 hover:border-brand hover:text-brand">{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
