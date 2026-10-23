import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { paymentReceipts } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/session';
import { ADMIN_CANCELLABLE, restoreStock, transition } from '@/lib/orders';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve_payment') }),
  z.object({ action: z.literal('reject_payment'), reason: z.string().trim().min(3, 'Add a reason so the customer knows what to fix.').max(300) }),
  z.object({ action: z.literal('mark_ready') }),
  z.object({ action: z.literal('mark_completed') }),
  z.object({ action: z.literal('cancel'), reason: z.string().trim().min(3, 'Add a reason for cancelling.').max(300) }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const input = parsed.data;

    const ok = await db.transaction(async (tx) => {
      const reviewPending = async (status: 'approved' | 'rejected', reason?: string) => {
        const [latest] = await tx.select({ id: paymentReceipts.id }).from(paymentReceipts)
          .where(and(eq(paymentReceipts.orderId, id), eq(paymentReceipts.status, 'pending')))
          .orderBy(desc(paymentReceipts.submittedAt)).limit(1);
        if (latest) {
          await tx.update(paymentReceipts)
            .set({ status, rejectionReason: reason ?? null, reviewedBy: admin.id, reviewedAt: new Date() })
            .where(eq(paymentReceipts.id, latest.id));
        }
      };
      switch (input.action) {
        case 'approve_payment':
          if (!(await transition(tx, id, ['payment_review'], 'paid'))) return false;
          await reviewPending('approved');
          return true;
        case 'reject_payment':
          // Back to awaiting payment so the customer can upload a correct receipt. Stock stays held.
          if (!(await transition(tx, id, ['payment_review'], 'awaiting_payment'))) return false;
          await reviewPending('rejected', input.reason);
          return true;
        case 'mark_ready':
          return transition(tx, id, ['paid'], 'ready');
        case 'mark_completed':
          return transition(tx, id, ['ready'], 'completed');
        case 'cancel':
          if (!(await transition(tx, id, ADMIN_CANCELLABLE, 'cancelled', { cancelledReason: input.reason }))) return false;
          await reviewPending('rejected', input.reason);
          await restoreStock(tx, id);
          return true;
      }
    });
    if (!ok) return jsonError('bad_status', 409);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
