import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const isDev = process.env.NODE_ENV !== 'production';

// The single Content-Security-Policy for the app. HSTS comes from Vercel on deploy.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co${isDev ? ' ws: http://localhost:*' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/** Refreshes the Supabase session cookie on every page request and sets the CSP. */
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(toSet: CookieToSet[]) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser().catch(() => null);
  }
  res.headers.set('Content-Security-Policy', CSP);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp|ico)$).*)'],
};
