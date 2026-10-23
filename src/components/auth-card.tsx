import { Zap } from 'lucide-react';

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-volt"><Zap className="h-6 w-6" fill="currentColor" aria-hidden /></span>
        <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-center text-sm text-ink-soft">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Only same-site paths, so ?next= cannot send people to another website. */
export function safeNext(raw: string | undefined | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/';
  return raw;
}
