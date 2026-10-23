import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/auth/route-client';
import { emailOnlySchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const parsed = emailOnlySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    if (!rateLimit(`resend:${clientIp(req.headers)}`, 3, 15 * 60_000) || !rateLimit(`resend:${parsed.data.email}`, 3, 15 * 60_000)) {
      return jsonError('rate_limited', 429);
    }
    const supabase = await createRouteSupabase();
    if (!supabase) return jsonError('auth_not_configured', 503);
    const { error } = await supabase.auth.resend({ type: 'signup', email: parsed.data.email });
    if (error && /rate limit|security purposes|only request this after/i.test(error.message)) return jsonError('rate_limited', 429);
    // Same answer whether or not the email exists, so this cannot be used to probe accounts.
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
