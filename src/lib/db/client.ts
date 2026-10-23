import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // The transaction pooler (:6543) cannot use prepared statements.
  const transactionPooler = url.includes(':6543') || /[?&]pgbouncer=true/i.test(url);
  cached = drizzle(postgres(url, { max: 10, idle_timeout: 20, prepare: !transactionPooler }), { schema });
  return cached;
}

/** Lazy so `next build` never needs a database. */
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];
