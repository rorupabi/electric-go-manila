import { Loader2 } from 'lucide-react';
import type { OrderStatus } from '@/lib/db/schema';

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function PageHeader({ title, subtitle, action }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      {icon ? <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">{icon}</div> : null}
      <p className="text-base font-semibold">{title}</p>
      {hint ? <p className="mt-1.5 text-sm text-ink-soft">{hint}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  awaiting_payment: 'badge-amber',
  payment_review: 'badge-blue',
  paid: 'badge-green',
  ready: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={`badge ${STATUS_STYLE[status]}`}>{label}</span>;
}

export function FormError({ message }: { message: string | null }) {
  return message ? <p role="alert" className="text-sm text-red-700">{message}</p> : null;
}
