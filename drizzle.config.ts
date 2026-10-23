import { config } from 'dotenv';
import { setDefaultResultOrder } from 'dns';
import type { Config } from 'drizzle-kit';

config({ path: '.env.local' });
// Prefer IPv4 without rewriting the URL; the Supabase pooler needs the hostname.
setDefaultResultOrder('ipv4first');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required (set it in .env.local)');

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
} satisfies Config;
