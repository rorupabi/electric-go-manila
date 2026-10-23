import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/** Supabase client bound to the request cookies. Writes fail silently in server components. */
export async function createRouteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(toSet: CookieToSet[]) {
        try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* read-only during server component render */ }
      },
    },
  });
}
