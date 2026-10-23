import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { orders, products } from '@/lib/db/schema';
import { requireAdmin, requireUser } from '@/lib/auth/session';
import { createSignedUpload } from '@/lib/storage/upload';
import { rateLimit } from '@/lib/rate-limit';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

const schema = z.object({
  kind: z.enum(['receipt', 'product']),
  entityId: z.string().uuid(),
  contentType: z.string().max(100),
  size: z.number().int().positive(),
});

/** Issues a one-time upload URL into the folder for this order (receipt) or product (photo). */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const { kind, entityId, contentType, size } = parsed.data;

    if (kind === 'receipt') {
      if (!rateLimit(`upload:receipt:${user.id}`, 10, 60 * 60_000)) return jsonError('rate_limited', 429);
      const order = (await db.select({ userId: orders.userId, status: orders.status }).from(orders).where(eq(orders.id, entityId)).limit(1))[0];
      if (!order || order.userId !== user.id) return jsonError('not_found', 404);
      if (order.status !== 'awaiting_payment') return jsonError('bad_status', 409);
    } else {
      await requireAdmin();
      if (!rateLimit(`upload:product:${user.id}`, 120, 60 * 60_000)) return jsonError('rate_limited', 429);
      const exists = (await db.select({ id: products.id }).from(products).where(eq(products.id, entityId)).limit(1))[0];
      if (!exists) return jsonError('not_found', 404);
    }
    return NextResponse.json(await createSignedUpload(kind, entityId, contentType, size));
  } catch (e) {
    return jsonRouteError(e);
  }
}
