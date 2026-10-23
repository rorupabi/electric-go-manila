import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/session';
import { productSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = productSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const { featured, compareAtPhp, ...rest } = parsed.data;
    const [row] = await db.insert(products).values({
      ...rest,
      compareAtPhp: compareAtPhp ?? null,
      featured: featured ? 1 : 0,
      slug: slugify(`${rest.brand} ${rest.name}`),
    }).onConflictDoNothing({ target: products.slug }).returning({ id: products.id });
    if (!row) return jsonError('slug_in_use', 409);
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    return jsonRouteError(e);
  }
}
