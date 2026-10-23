import Link from 'next/link';
import { ChevronDown, ChevronRight, Menu, UserRound } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { CATEGORIES, TIERS } from '@/lib/db/schema';
import { BrandMark } from './brand';
import { CartLink } from './cart';
import { LogoutButton } from './logout-button';
import { MenuLink } from './menu-link';
import { SearchButton } from './search-button';

const MENUS = CATEGORIES.map((c) => ({
  label: c.short,
  links: [
    { href: `/shop?category=${c.code}`, label: `Explore all ${c.short.toLowerCase()}`, hint: 'Every tier, cheapest first' },
    ...TIERS.map((t) => ({ href: `/shop?category=${c.code}&tier=${t.code}`, label: t.label, hint: t.hint })),
  ],
}));

export async function SiteHeader() {
  const user = await getSessionUser().catch(() => null);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <BrandMark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {MENUS.map((m) => (
            // Opens on hover and on keyboard focus (focus-within), no JavaScript needed.
            <div key={m.label} className="group relative">
              <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-foreground hover:bg-surface-soft group-focus-within:bg-surface-soft" aria-haspopup="true">
                {m.label} <ChevronDown className="h-4 w-4 transition group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden />
              </button>
              <div className="invisible absolute left-0 top-full z-40 w-72 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <ul className="overflow-hidden rounded-xl bg-night p-1.5 text-white shadow-2xl">
                  {m.links.map((l, i) => (
                    <li key={l.href} className={i === 1 ? 'mt-1 border-t border-white/10 pt-1' : undefined}>
                      <MenuLink href={l.href} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-white/10 focus:bg-white/10">
                        <span>
                          <span className="block text-sm font-semibold">{l.label}</span>
                          <span className="block text-xs text-white/60">{l.hint}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-volt" aria-hidden />
                      </MenuLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <Link href="/shop" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-surface-soft">Shop all</Link>
        </nav>
        <div className="flex items-center gap-1">
          <SearchButton />
          <CartLink />
          {user ? (
            <div className="hidden items-center gap-1 md:flex">
              {user.role === 'admin' ? <Link href="/admin" className="btn btn-outline btn-sm">Admin</Link> : null}
              <Link href="/orders" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-soft">My orders</Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/login" className="hidden min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-surface-soft md:inline-flex">
              <UserRound className="h-4 w-4" aria-hidden /> Sign in
            </Link>
          )}
          <details className="relative md:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl hover:bg-surface-soft [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <div className="card absolute right-0 top-12 max-h-[75dvh] w-72 overflow-y-auto p-2 shadow-xl">
              {MENUS.map((m) => (
                <div key={m.label} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-ink-soft">{m.label}</p>
                  {m.links.map((l) => (
                    <MenuLink key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface-soft">{l.label}</MenuLink>
                  ))}
                </div>
              ))}
              <MenuLink href="/shop" className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-surface-soft">Shop all</MenuLink>
              <div className="my-1 border-t border-border" />
              {user ? (
                <>
                  <MenuLink href="/orders" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface-soft">My orders</MenuLink>
                  {user.role === 'admin' ? <MenuLink href="/admin" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface-soft">Admin</MenuLink> : null}
                  <LogoutButton block />
                </>
              ) : (
                <>
                  <MenuLink href="/login" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface-soft">Sign in</MenuLink>
                  <MenuLink href="/register" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface-soft">Create account</MenuLink>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
