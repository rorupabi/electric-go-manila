import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Service-role client: bypasses RLS. Server only — never import from a client component. */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://invalid.local',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'invalid',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const buckets = {
  products: process.env.SUPABASE_BUCKET_PRODUCTS ?? 'products',
  receipts: process.env.SUPABASE_BUCKET_RECEIPTS ?? 'receipts',
} as const;
