import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { productPhotos } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/session';
import { removeByPublicUrl } from '@/lib/storage/upload';
import { jsonError, jsonRouteError } from '@/lib/api';

type Ctx = { params: Promise<{ id: string; photoId: string }> };

/** Makes this photo the cover (first), keeping the others in order. */
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id, photoId } = await params;
    const photos = await db.select({ id: productPhotos.id }).from(productPhotos)
      .where(eq(productPhotos.productId, id)).orderBy(asc(productPhotos.sortOrder), asc(productPhotos.createdAt));
    if (!photos.some((p) => p.id === photoId)) return jsonError('not_found', 404);
    const ordered = [photoId, ...photos.map((p) => p.id).filter((p) => p !== photoId)];
    await db.transaction(async (tx) => {
      for (const [i, pid] of ordered.entries()) {
        await tx.update(productPhotos).set({ sortOrder: i }).where(eq(productPhotos.id, pid));
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id, photoId } = await params;
    const [row] = await db.delete(productPhotos)
      .where(and(eq(productPhotos.id, photoId), eq(productPhotos.productId, id)))
      .returning({ url: productPhotos.url });
    if (!row) return jsonError('not_found', 404);
    await removeByPublicUrl(row.url).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
