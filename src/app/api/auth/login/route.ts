import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/auth/route-client';
import { loginSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`login:${clientIp(req.headers)}`, 8, 15 * 60_000)) return jsonError('rate_limited', 429);
    const parsed = loginSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);

    const supabase = await createRouteSupabase();
    if (!supabase) return jsonError('auth_not_configured', 503);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) return jsonError('email_not_confirmed', 403);
      return jsonError('invalid_credentials', 401);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
