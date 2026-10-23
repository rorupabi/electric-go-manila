import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { orders, paymentReceipts, productPhotos } from '@/lib/db/schema';
import { requireAdmin, requireUser } from '@/lib/auth/session';
import { isAllowedTarget, publicUrl, validateAndStore } from '@/lib/storage/upload';
import { supabaseAdmin } from '@/lib/storage/supabase';
import { transition } from '@/lib/orders';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

const MAX_PHOTOS = 6;

const schema = z.object({
  kind: z.enum(['receipt', 'product']),
  entityId: z.string().uuid(),
  bucket: z.string().max(100),
  path: z.string().min(1).max(300),
  referenceNumber: z.string().trim().max(80).optional(),
});

/** Validates an upload the browser just PUT, stores the normalized file, and records it. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const { kind, entityId, bucket, path } = parsed.data;

    if (kind === 'receipt') {
      const order = (await db.select({ userId: orders.userId, status: orders.status }).from(orders).where(eq(orders.id, entityId)).limit(1))[0];
      if (!order || order.userId !== user.id) return jsonError('not_found', 404);
      if (order.status !== 'awaiting_payment') return jsonError('bad_status', 409);
    } else {
      await requireAdmin();
    }
    // Only objects this server issued for this order/product, so nobody can read or delete others' files.
    if (!isAllowedTarget(kind, entityId, bucket, path)) return jsonError('forbidden', 403);

    const stored = await validateAndStore(kind, bucket, path);
    const url = publicUrl(bucket, stored.path);

    if (kind === 'receipt') {
      const ok = await db.transaction(async (tx) => {
        if (!(await transition(tx, entityId, ['awaiting_payment'], 'payment_review'))) return false;
        await tx.insert(paymentReceipts).values({ orderId: entityId, fileUrl: url, referenceNumber: parsed.data.referenceNumber || null });
        return true;
      });
      if (!ok) {
        await supabaseAdmin.storage.from(bucket).remove([stored.path]);
        return jsonError('bad_status', 409);
      }
      return NextResponse.json({ ok: true });
    }

    const [{ n }] = await db.select({ n: count() }).from(productPhotos).where(eq(productPhotos.productId, entityId));
    if (n >= MAX_PHOTOS) {
      await supabaseAdmin.storage.from(bucket).remove([stored.path]);
      return jsonError('too_many_photos', 409);
    }
    const [photo] = await db.insert(productPhotos)
      .values({ productId: entityId, url, sortOrder: n })
      .returning({ id: productPhotos.id, url: productPhotos.url });
    return NextResponse.json({ ok: true, photo });
  } catch (e) {
    return jsonRouteError(e);
  }
}
