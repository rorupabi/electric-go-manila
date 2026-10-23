import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { db } from '@/lib/db/client';
import { orderItems, orders, paymentReceipts } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getShopSettings } from '@/lib/catalog';
import { CUSTOMER_CANCELLABLE, STATUS_LABEL } from '@/lib/orders';
import { StatusBadge } from '@/components/ui';
import { displayPhone, formatDateTime, formatPHP } from '@/lib/utils';
import { ReceiptUpload } from './receipt-upload';
import { CancelOrder } from './cancel-order';

export const metadata: Metadata = { title: 'Order' };
export const dynamic = 'force-dynamic';

const STEPS = ['awaiting_payment', 'payment_review', 'paid', 'ready', 'completed'] as const;

export default async function OrderPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/orders/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order || (order.userId !== user.id && user.role !== 'admin')) notFound();

  const [items, receipts, settings, sp] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select({ status: paymentReceipts.status, rejectionReason: paymentReceipts.rejectionReason, submittedAt: paymentReceipts.submittedAt })
      .from(paymentReceipts).where(eq(paymentReceipts.orderId, id)).orderBy(desc(paymentReceipts.submittedAt)),
    getShopSettings(),
    searchParams,
  ]);
  const lastRejected = order.status === 'awaiting_payment' ? receipts.find((r) => r.status === 'rejected') : undefined;
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="container-page py-8">
      <Link href="/orders" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-ink-soft hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden /> My orders
      </Link>
      {sp.placed && order.status === 'awaiting_payment' ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p className="text-sm"><span className="font-semibold">Order placed.</span> Your items are reserved. Pay below and upload your receipt to confirm.</p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.number}</h1>
          <p className="text-sm text-ink-soft">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} label={STATUS_LABEL[order.status]} />
      </div>

      {order.status !== 'cancelled' && (
        <ol className="mb-8 grid grid-cols-5 gap-1 text-[11px] sm:text-xs" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="space-y-1.5">
              <div className={`h-1.5 rounded-full ${i <= stepIndex ? 'bg-brand' : 'bg-border'}`} />
              <span className={i <= stepIndex ? 'font-semibold' : 'text-ink-soft'}>{STATUS_LABEL[s].split(' / ')[0]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {order.status === 'awaiting_payment' && order.userId === user.id && (
            <section className="card space-y-4 p-5">
              <h2 className="font-semibold">Pay {formatPHP(order.totalPhp)}</h2>
              {lastRejected ? (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                  Your last receipt was not accepted: {lastRejected.rejectionReason}. Please upload a new one.
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {settings.gcashNumber ? (
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold uppercase text-ink-soft">GCash</p>
                    <p className="mt-1 font-semibold">{settings.gcashNumber}</p>
                    {settings.gcashName ? <p className="text-sm text-ink-soft">{settings.gcashName}</p> : null}
                  </div>
                ) : null}
                {settings.mayaNumber ? (
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold uppercase text-ink-soft">Maya</p>
                    <p className="mt-1 font-semibold">{settings.mayaNumber}</p>
                    {settings.mayaName ? <p className="text-sm text-ink-soft">{settings.mayaName}</p> : null}
                  </div>
                ) : null}
                {settings.bankAccountNumber ? (
                  <div className="rounded-xl border border-border p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-ink-soft">Bank transfer · {settings.bankName || 'BPI'}</p>
                    <p className="mt-1 font-semibold tracking-wide">{settings.bankAccountNumber}</p>
                    {settings.bankAccountName ? <p className="text-sm text-ink-soft">{settings.bankAccountName}</p> : null}
                    <p className="mt-2 text-xs text-ink-soft">Pay through the {settings.bankName || 'BPI'} app, InstaPay, or PESONet from any bank. InstaPay arrives right away; PESONet can take until the next banking day.</p>
                  </div>
                ) : null}
                {!settings.gcashNumber && !settings.mayaNumber && !settings.bankAccountNumber ? (
                  <p className="text-sm text-ink-soft sm:col-span-2">Payment details are being set up. We will message you on {displayPhone(order.contactPhone)}.</p>
                ) : null}
              </div>
              <p className="text-sm text-ink-soft">Send the exact total, then upload a screenshot of the receipt or transfer confirmation. Put <span className="font-semibold text-foreground">{order.number}</span> in the message or remarks if your app allows it.</p>
              <ReceiptUpload orderId={order.id} />
            </section>
          )}
          {order.status === 'payment_review' && (
            <section className="card p-5 text-sm"><p className="font-semibold">Receipt received.</p><p className="mt-1 text-ink-soft">We are checking your payment. This usually takes a few hours during shop hours.</p></section>
          )}
          {order.status === 'cancelled' && (
            <section className="card p-5 text-sm"><p className="font-semibold">This order was cancelled.</p>{order.cancelledReason ? <p className="mt-1 text-ink-soft">{order.cancelledReason}</p> : null}</section>
          )}

          <section className="card overflow-hidden">
            <h2 className="border-b border-border px-5 py-3 font-semibold">Items</h2>
            <ul className="divide-y divide-border text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3 px-5 py-3">
                  <span>{it.name} × {it.quantity}</span>
                  <span className="font-medium">{formatPHP(it.unitPricePhp * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-border px-5 py-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{formatPHP(order.subtotalPhp)}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><span>{order.deliveryFeePhp ? formatPHP(order.deliveryFeePhp) : 'Free'}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPHP(order.totalPhp)}</span></div>
            </div>
          </section>
        </div>

        <aside className="card h-fit space-y-3 p-5 text-sm">
          <h2 className="font-semibold">{order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}</h2>
          <p>{order.contactName}<br /><span className="text-ink-soft">{displayPhone(order.contactPhone)}</span></p>
          {order.fulfillment === 'delivery'
            ? <p className="whitespace-pre-line">{order.address}</p>
            : <p className="text-ink-soft">{settings.pickupAddress ?? 'We will send the pickup address once your payment is confirmed.'}</p>}
          {order.notes ? <p className="text-ink-soft">Note: {order.notes}</p> : null}
          {CUSTOMER_CANCELLABLE.includes(order.status) && order.userId === user.id ? <CancelOrder orderId={order.id} /> : null}
        </aside>
      </div>
    </div>
  );
}
