// npm run seed            — admin account, shop settings, sample products (entry → high-end) with photos.
// npm run seed -- --photos — also replace the photos of the sample products with fresh illustrations.
// Safe to run again: existing products (matched by slug) keep their stock/prices; tier and specs are refreshed.
import { config } from 'dotenv';
import { setDefaultResultOrder } from 'dns';
import { randomUUID } from 'crypto';
import postgres from 'postgres';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { productSvg, type ArtStyle } from './product-art';

config({ path: '.env.local' });
setDefaultResultOrder('ipv4first');

const need = (k: string) => {
  const v = process.env[k];
  if (!v) { console.error(`Missing ${k} in .env.local`); process.exit(1); }
  return v;
};
const sql = postgres(need('DATABASE_URL'), { max: 1, prepare: false });
const supabase = createClient(need('NEXT_PUBLIC_SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const PRODUCTS_BUCKET = process.env.SUPABASE_BUCKET_PRODUCTS ?? 'products';
const REPLACE_PHOTOS = process.argv.includes('--photos');

type Sample = {
  name: string; brand: string; category: 'kick_scooter' | 'ebike'; tier: 'entry' | 'mid' | 'high';
  pricePhp: number; compareAtPhp?: number; stock: number; featured: boolean;
  style: ArtStyle; color: string; description: string; specs: Record<string, number | string>;
};

const SAMPLES: Sample[] = [
  // ---- Electric kick scooters ----
  {
    name: 'Mini 200 Kids & Teens Scooter', brand: 'Kidlat', category: 'kick_scooter', tier: 'entry', pricePhp: 8990,
    stock: 15, featured: false, style: 'scooter-compact', color: '#65a30d',
    description: 'A light, low-speed scooter for teens and short rides around the village. Speed-limited modes keep first rides calm.',
    specs: { rangeKm: 15, topSpeedKph: 15, motorW: 200, batteryWh: 144, chargeHours: 3, weightKg: 8.9, maxLoadKg: 75, wheelSize: '6.5" solid' },
  },
  {
    name: 'Lite 250 Starter Kick Scooter', brand: 'Kidlat', category: 'kick_scooter', tier: 'entry', pricePhp: 12490,
    stock: 12, featured: true, style: 'scooter-compact', color: '#16a34a',
    description: 'An easy first e-scooter for students and short errands. Simple controls, three speed modes, and a bright display.',
    specs: { rangeKm: 20, topSpeedKph: 20, motorW: 250, batteryWh: 180, chargeHours: 4, weightKg: 10.8, maxLoadKg: 90, wheelSize: '8" solid' },
  },
  {
    name: 'Urban 350 Foldable Kick Scooter', brand: 'VoltRide', category: 'kick_scooter', tier: 'mid', pricePhp: 18990, compareAtPhp: 21990,
    stock: 8, featured: true, style: 'scooter-commuter', color: '#15803d',
    description: 'A foldable commuter for the trip between your condo and the MRT. Folds in three seconds and fits under an office desk.\n\nIncludes charger, bell, and front and rear lights.',
    specs: { rangeKm: 30, topSpeedKph: 25, motorW: 350, batteryWh: 280, chargeHours: 5, weightKg: 12.5, maxLoadKg: 100, wheelSize: '8.5" solid' },
  },
  {
    name: 'Commute 400 Seated E-Scooter', brand: 'VoltRide', category: 'kick_scooter', tier: 'mid', pricePhp: 24990,
    stock: 6, featured: false, style: 'scooter-seated', color: '#7c3aed',
    description: 'Stand or sit: the removable seat makes longer errands comfortable. A front bag mount holds groceries or a laptop.',
    specs: { rangeKm: 40, topSpeedKph: 25, motorW: 400, batteryWh: 420, chargeHours: 6, weightKg: 18, maxLoadKg: 120, wheelSize: '10" pneumatic' },
  },
  {
    name: 'Metro Pro 500 Long-Range Scooter', brand: 'VoltRide', category: 'kick_scooter', tier: 'high', pricePhp: 32990,
    stock: 5, featured: true, style: 'scooter-commuter', color: '#0f766e',
    description: 'Dual brakes, front suspension, and pneumatic tires for rough Manila roads. Enough range for a full week of short commutes on one charge.',
    specs: { rangeKm: 55, topSpeedKph: 30, motorW: 500, batteryWh: 540, chargeHours: 7, weightKg: 17, maxLoadKg: 120, wheelSize: '10" pneumatic' },
  },
  {
    name: 'Bolt X Dual-Motor All-Terrain Scooter', brand: 'Bagyo', category: 'kick_scooter', tier: 'high', pricePhp: 54990,
    stock: 2, featured: true, style: 'scooter-offroad', color: '#b91c1c',
    description: 'Two motors, full suspension, and 11-inch off-road tires. Built for experienced riders who want power and stability.\n\nWear a helmet and protective gear. Check local rules on where high-speed scooters may be ridden.',
    specs: { rangeKm: 80, topSpeedKph: 45, motorW: 2400, batteryWh: 1250, chargeHours: 9, weightKg: 36, maxLoadKg: 150, wheelSize: '11" off-road' },
  },
  // ---- Pedal-assist e-bikes ----
  {
    name: 'Step-Thru 250 City E-Bike', brand: 'Daloy', category: 'ebike', tier: 'entry', pricePhp: 29990,
    stock: 7, featured: true, style: 'bike-stepthru', color: '#0e7490',
    description: 'A low step-through frame that is easy to get on in office clothes. Front basket and rack battery for daily errands.',
    specs: { rangeKm: 40, topSpeedKph: 25, motorW: 250, batteryWh: 360, chargeHours: 5, weightKg: 23, maxLoadKg: 110, wheelSize: '26"' },
  },
  {
    name: 'Fold-N-Go 20" Folding E-Bike', brand: 'Daloy', category: 'ebike', tier: 'entry', pricePhp: 36990,
    stock: 6, featured: false, style: 'bike-folding', color: '#15803d',
    description: 'Folds small enough for a car trunk or a condo storage room. Ride to the terminal, fold, and bring it along.',
    specs: { rangeKm: 45, topSpeedKph: 25, motorW: 250, batteryWh: 360, chargeHours: 5, weightKg: 19, maxLoadKg: 110, wheelSize: '20"' },
  },
  {
    name: 'City Commuter Pedal-Assist E-Bike', brand: 'Daloy', category: 'ebike', tier: 'mid', pricePhp: 42990, compareAtPhp: 47990,
    stock: 4, featured: true, style: 'bike-city', color: '#166534',
    description: 'Pedal like a normal bike while the motor flattens the flyovers. Five assist levels, fenders, rear rack, and an integrated light.\n\nRide with pedals only when the battery is off.',
    specs: { rangeKm: 60, topSpeedKph: 25, motorW: 250, batteryWh: 418, chargeHours: 5, weightKg: 22, maxLoadKg: 120, wheelSize: '27.5"' },
  },
  {
    name: 'Urban Belt-Drive E-Bike', brand: 'Daloy', category: 'ebike', tier: 'mid', pricePhp: 49990,
    stock: 3, featured: false, style: 'bike-belt', color: '#7c3aed',
    description: 'A clean carbon belt instead of a greasy chain: quiet, low maintenance, and no stains on your pants.',
    specs: { rangeKm: 65, topSpeedKph: 25, motorW: 250, batteryWh: 500, chargeHours: 5.5, weightKg: 21, maxLoadKg: 120, wheelSize: '28"' },
  },
  {
    name: 'Cargo Max Pedal-Assist E-Bike', brand: 'Kidlat', category: 'ebike', tier: 'high', pricePhp: 58990,
    stock: 2, featured: false, style: 'bike-cargo', color: '#b91c1c',
    description: 'A long-tail cargo e-bike for deliveries, groceries, or school runs. Strong rear rack, wide tires, and a stable low frame.',
    specs: { rangeKm: 70, topSpeedKph: 25, motorW: 500, batteryWh: 720, chargeHours: 6, weightKg: 32, maxLoadKg: 180, wheelSize: '24" fat' },
  },
  {
    name: 'Trail Pro 29 Electric Mountain Bike', brand: 'Bagyo', category: 'ebike', tier: 'high', pricePhp: 79990,
    stock: 2, featured: true, style: 'bike-mtb', color: '#0e7490',
    description: 'A mid-drive e-MTB with a suspension fork and knobby tires for Antipolo and Rizal trails, with the range for a full weekend ride.',
    specs: { rangeKm: 90, topSpeedKph: 25, motorW: 250, batteryWh: 630, chargeHours: 6, weightKg: 24, maxLoadKg: 130, wheelSize: '29" knobby' },
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function uploadPhotos(productId: string, s: Sample) {
  for (const [i, scene] of (['studio', 'street'] as const).entries()) {
    const webp = await sharp(Buffer.from(productSvg(s.style, s.color, scene))).webp({ quality: 86 }).toBuffer();
    const path = `products/${productId}/${Date.now()}-${randomUUID()}.webp`;
    const { error } = await supabase.storage.from(PRODUCTS_BUCKET).upload(path, webp, { contentType: 'image/webp' });
    if (error) throw new Error(`Photo upload failed for ${s.name}: ${error.message}`);
    const url = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path).data.publicUrl;
    await sql`insert into product_photos (product_id, url, sort_order) values (${productId}, ${url}, ${i})`;
  }
}

async function removePhotos(productId: string) {
  const rows = await sql<{ url: string }[]>`delete from product_photos where product_id = ${productId} returning url`;
  const paths = rows.map((r) => decodeURIComponent(r.url.split(`/object/public/${PRODUCTS_BUCKET}/`)[1] ?? '')).filter(Boolean);
  if (paths.length) await supabase.storage.from(PRODUCTS_BUCKET).remove(paths);
}

async function ensureAdmin() {
  const email = need('ADMIN_EMAIL').toLowerCase();
  const password = need('ADMIN_PASSWORD');
  let id: string | undefined;
  const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: 'Shop Admin' } });
  if (created?.user) id = created.user.id;
  else if (error && /already/i.test(error.message)) {
    for (let page = 1; page <= 10 && !id; page++) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      id = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (!data.users.length) break;
    }
  } else if (error) throw error;
  if (!id) throw new Error('Could not create or find the admin user');
  await sql`insert into users (id, email, name, role) values (${id}, ${email}, 'Shop Admin', 'admin')
            on conflict (id) do update set role = 'admin'`;
  console.log(`Admin ready: ${email}`);
}

async function main() {
  await ensureAdmin();
  await sql`insert into shop_settings (id, pickup_address, delivery_fee_php) values ('shop', 'Sample address: update in Admin → Settings', 300)
            on conflict (id) do nothing`;

  for (const s of SAMPLES) {
    const slug = slugify(`${s.brand} ${s.name}`);
    const [row] = await sql<{ id: string; inserted: boolean }[]>`
      insert into products (slug, name, brand, category, tier, price_php, compare_at_php, stock, description, specs, status, featured)
      values (${slug}, ${s.name}, ${s.brand}, ${s.category}, ${s.tier}, ${s.pricePhp}, ${s.compareAtPhp ?? null}, ${s.stock},
              ${s.description}, ${sql.json(s.specs)}, 'active', ${s.featured ? 1 : 0})
      on conflict (slug) do update set tier = excluded.tier, specs = excluded.specs, description = excluded.description, featured = excluded.featured, updated_at = now()
      returning id, (xmax = 0) as inserted`;
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from product_photos where product_id = ${row.id}`;
    if (REPLACE_PHOTOS && n > 0) await removePhotos(row.id);
    if (REPLACE_PHOTOS || n === 0) await uploadPhotos(row.id, s);
    console.log(`${row.inserted ? 'Added  ' : 'Updated'} [${s.tier.padEnd(5)}] ${s.name}${REPLACE_PHOTOS || n === 0 ? ' (+2 photos)' : ''}`);
  }
  await sql.end();
  console.log('Seed complete.');
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await sql.end({ timeout: 1 }).catch(() => undefined);
  process.exit(1);
});
