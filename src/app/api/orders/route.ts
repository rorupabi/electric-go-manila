import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { placeOrderSchema } from '@/lib/validation';
import { OutOfStockError, placeOrder } from '@/lib/orders';
import { rateLimit } from '@/lib/rate-limit';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!rateLimit(`order:${user.id}`, 10, 60 * 60_000)) return jsonError('rate_limited', 429);
    const parsed = placeOrderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const order = await placeOrder({ userId: user.id, ...parsed.data });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    if (e instanceof OutOfStockError) return jsonError('out_of_stock', 409);
    return jsonRouteError(e);
  }
}
