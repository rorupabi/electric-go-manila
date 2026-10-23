import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/auth/route-client';
import { registerSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';
import { PASSWORD_HINT } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`register:${clientIp(req.headers)}`, 5, 15 * 60_000)) return jsonError('rate_limited', 429);
    const parsed = registerSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const { email, password, name, phone } = parsed.data;

    const supabase = await createRouteSupabase();
    if (!supabase) return jsonError('auth_not_configured', 503);

    // Supabase emails a code ({{ .Token }} in the Confirm signup template). The app profile row
    // is created after the code is verified, from this metadata (see getSessionUser).
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone } } });
    if (error) {
      if (/already (been )?registered|already exists/i.test(error.message)) return jsonError('email_in_use', 409);
      if (error.code === 'weak_password') {
        return NextResponse.json({ error: 'invalid_input', issues: [{ message: PASSWORD_HINT }] }, { status: 400 });
      }
      if (/rate limit|security purposes/i.test(error.message)) return jsonError('rate_limited', 429);
      throw error;
    }
    // Supabase hides existing accounts behind an empty identities list.
    if (data.user && data.user.identities?.length === 0) return jsonError('email_in_use', 409);
    if (data.session) {
      // "Confirm email" is off in Supabase: the account is usable right away.
      return NextResponse.json({ ok: true, needsCode: false });
    }
    return NextResponse.json({ ok: true, needsCode: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
