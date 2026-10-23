import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/settings', label: 'Settings' },
];

/** Every /admin page is admin-only; the API routes check again on their own. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'admin') redirect('/');
  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border" aria-label="Admin">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-soft hover:border-brand hover:text-foreground">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
