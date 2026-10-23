import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/auth/route-client';
import { otpSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`verify:${clientIp(req.headers)}`, 10, 15 * 60_000)) return jsonError('rate_limited', 429);
    const parsed = otpSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);

    const supabase = await createRouteSupabase();
    if (!supabase) return jsonError('auth_not_configured', 503);
    const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: 'signup' });
    if (error) return jsonError('invalid_otp', 401);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
