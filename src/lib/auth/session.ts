import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users, type UserRole } from '@/lib/db/schema';
import { createRouteSupabase } from './route-client';

export type SessionUser = { id: string; email: string; name: string; phone: string | null; role: UserRole };

/**
 * The signed-in user's app profile. The profile row is created on first use from the
 * Supabase Auth user (name/phone come from sign-up metadata), so a verified account never
 * ends up without one. Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createRouteSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) return null;

  const existing = (await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0];
  if (existing) return existing;

  const meta = (user.user_metadata ?? {}) as { name?: string; phone?: string };
  const email = user.email.toLowerCase();
  const [created] = await db.insert(users).values({
    id: user.id,
    email,
    name: meta.name?.trim() || email.split('@')[0],
    phone: meta.phone ?? null,
    role: email === process.env.ADMIN_EMAIL?.toLowerCase() ? 'admin' : 'customer',
  }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0] ?? null;
});

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error('UNAUTHENTICATED');
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== 'admin') throw new Error('FORBIDDEN');
  return u;
}
