import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { SHOP_SETTINGS_ID, shopSettings } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/session';
import { settingsSchema } from '@/lib/validation';
import { jsonInvalid, jsonRouteError } from '@/lib/api';

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    const values = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v]),
    ) as typeof parsed.data;
    await db.insert(shopSettings)
      .values({ id: SHOP_SETTINGS_ID, ...values, updatedAt: new Date() })
      .onConflictDoUpdate({ target: shopSettings.id, set: { ...values, updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonRouteError(e);
  }
}
