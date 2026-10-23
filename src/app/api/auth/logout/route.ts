import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/auth/route-client';

export async function POST() {
  const supabase = await createRouteSupabase();
  await supabase?.auth.signOut();
  return NextResponse.json({ ok: true });
}
