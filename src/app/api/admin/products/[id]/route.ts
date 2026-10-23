import { NextRequest, NextResponse } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { orderItems, productPhotos, products } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/session';
import { productSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';
import { removeByPublicUrl } from '@/lib/storage/upload';
import { jsonError, jsonInvalid, jsonRouteError } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = productSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const { featured, compareAtPhp, ...rest } = parsed.data;
    const slug = slugify(`${rest.brand} ${rest.name}`);
    const taken = await db.select({ id: products.id }).from(products).where(and(eq(products.slug, slug), ne(products.id, id))).limit(1);
    if (taken[0]) return jsonError('slug_in_use', 409);
    const rows = await db.update(products)
      .set({ ...rest, slug, compareAtPhp: compareAtPhp ?? null, featured: featured ? 1 : 0, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (!rows[0]) return jsonError('not_found', 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const sold = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.productId, id)).limit(1);
    if (sold[0]) return jsonError('has_orders', 409);
    const photos = await db.select({ url: productPhotos.url }).from(productPhotos).where(eq(productPhotos.productId, id));
    const rows = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    if (!rows[0]) return jsonError('not_found', 404);
    await Promise.all(photos.map((p) => removeByPublicUrl(p.url).catch(() => undefined)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
