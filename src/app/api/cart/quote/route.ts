import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { quoteProducts } from '@/lib/catalog';
import { jsonInvalid, jsonRouteError } from '@/lib/api';

const schema = z.object({ ids: z.array(z.string().uuid()).max(20) });

/** Current name, price, stock and photo for the products in a cart. Public. */
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonInvalid(parsed.error);
    return NextResponse.json({ products: await quoteProducts(parsed.data.ids) });
  } catch (e) {
    return jsonRouteError(e);
  }
}
