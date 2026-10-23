import 'server-only';
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { CATEGORIES, productPhotos, products, SHOP_SETTINGS_ID, shopSettings, TIERS, type CategoryCode, type TierCode } from '@/lib/db/schema';

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategoryCode;
  tier: TierCode;
  pricePhp: number;
  compareAtPhp: number | null;
  stock: number;
  specs: typeof products.$inferSelect['specs'];
  cover: string | null;
};

export function categoryLabel(code: string, short = false): string {
  const c = CATEGORIES.find((x) => x.code === code);
  return c ? (short ? c.short : c.label) : code;
}

export function isCategory(v: string | undefined): v is CategoryCode {
  return CATEGORIES.some((c) => c.code === v);
}

export function isTier(v: string | undefined): v is TierCode {
  return TIERS.some((t) => t.code === v);
}

export function tierLabel(code: string): string {
  return TIERS.find((t) => t.code === code)?.label ?? code;
}

// Table names are written out: Drizzle leaves columns unqualified inside a sql`` subquery,
// so "id" would bind to product_photos.id instead of the outer products.id.
const coverSql = sql<string | null>`(
  select pp.url from product_photos pp
  where pp.product_id = "products"."id"
  order by pp.sort_order asc, pp.created_at asc limit 1
)`;

const cardColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  brand: products.brand,
  category: products.category,
  tier: products.tier,
  pricePhp: products.pricePhp,
  compareAtPhp: products.compareAtPhp,
  stock: products.stock,
  specs: products.specs,
  cover: coverSql,
};

export type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'newest';

const tierRank = sql`case ${products.tier} when 'entry' then 0 when 'mid' then 1 else 2 end`;

/** Trims and caps a search term; returns '' when there is nothing to search for. */
export function cleanQuery(raw: string | undefined): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export async function listProducts(opts: { q?: string; category?: CategoryCode; tier?: TierCode; sort?: SortKey; featuredOnly?: boolean; limit?: number } = {}): Promise<ProductCard[]> {
  const where = [eq(products.status, 'active')];
  if (opts.category) where.push(eq(products.category, opts.category));
  if (opts.tier) where.push(eq(products.tier, opts.tier));
  if (opts.q) {
    // Every word must match the name, brand, or description. % and _ are escaped so they match literally.
    for (const word of opts.q.split(' ')) {
      const pattern = `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      where.push(or(ilike(products.name, pattern), ilike(products.brand, pattern), ilike(products.description, pattern))!);
    }
  }
  if (opts.featuredOnly) where.push(eq(products.featured, 1));
  const order =
    opts.sort === 'price_asc' ? [asc(products.pricePhp)]
    : opts.sort === 'price_desc' ? [desc(products.pricePhp)]
    : opts.sort === 'newest' ? [desc(products.createdAt)]
    : [desc(sql`${products.stock} > 0`), asc(tierRank), asc(products.pricePhp)];
  return db.select(cardColumns).from(products).where(and(...where)).orderBy(...order).limit(opts.limit ?? 60);
}

export async function getProductBySlug(slug: string) {
  const product = (await db.select().from(products).where(and(eq(products.slug, slug), eq(products.status, 'active'))).limit(1))[0];
  if (!product) return null;
  const photos = await db
    .select({ id: productPhotos.id, url: productPhotos.url })
    .from(productPhotos)
    .where(eq(productPhotos.productId, product.id))
    .orderBy(asc(productPhotos.sortOrder), asc(productPhotos.createdAt));
  return { ...product, photos };
}

/** Current price/stock for cart lines. Unknown or draft products are left out. */
export async function quoteProducts(ids: string[]): Promise<ProductCard[]> {
  if (!ids.length) return [];
  return db.select(cardColumns).from(products).where(and(inArray(products.id, ids), eq(products.status, 'active')));
}

export async function getShopSettings() {
  const row = (await db.select().from(shopSettings).where(eq(shopSettings.id, SHOP_SETTINGS_ID)).limit(1))[0];
  return row ?? {
    id: SHOP_SETTINGS_ID, gcashName: null, gcashNumber: null, mayaName: null, mayaNumber: null,
    bankName: 'BPI' as string | null, bankAccountName: null, bankAccountNumber: null,
    pickupAddress: null, deliveryFeePhp: 300, updatedAt: new Date(),
  };
}
