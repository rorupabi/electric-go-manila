# Electric Go Manila

*Ride clean. Ride Manila.* An online store for electric kick scooters and pedal-assist e-bikes in Metro Manila, from entry level to high-end.

## Features

- **Shop:** kick scooters and e-bikes in three tiers (Entry level, Mid-range, High-end), search, sorting, product galleries and specs
- **Cart and checkout:** cart saved in the browser, live price and stock checks, pickup or Metro Manila delivery
- **Accounts:** sign-up with an emailed code (Supabase Auth), order history with progress tracking
- **Payment:** GCash, Maya, or bank transfer (BPI). Customers upload a receipt; admins approve it
- **Admin:** dashboard, order handling (approve or reject receipts, ready, completed, cancel), products with up to 6 photos, shop settings
- **Stock safety:** units are reserved atomically at checkout (no overselling) and returned when an order is cancelled
- **Security:** uploads restricted to server-issued folders, images re-encoded to WebP with EXIF/GPS removed, private receipts served through short-lived signed URLs, CSP headers, rate limits

## Tech stack

TypeScript · Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL · Drizzle ORM · Supabase (Auth, Storage) · Zod · sharp

## Setup

1. **Install packages**
   ```bash
   npm install
   ```
2. **Create a Supabase project**, then:
   - Storage: create buckets `products` (**public**) and `receipts` (**private**)
   - Authentication → Emails → "Confirm signup" template: include `{{ .Token }}` so sign-up emails contain a code
3. **Environment:** copy `.env.example` to `.env.local` and fill it in. Use the **Session pooler** connection string for `DATABASE_URL`.
4. **Create tables and sample data**
   ```bash
   npm run db:push
   npm run seed
   ```
   `seed` creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, shop settings, and 12 sample products with generated illustrations. Use `npm run seed -- --photos` to redraw the sample images.
5. **Run**
   ```bash
   npm run dev
   ```
   Then open http://localhost:3000. Sign in with the admin account and set your payment details in **Admin → Settings**.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:push` | Create or update database tables from `src/lib/db/schema.ts` |
| `npm run db:studio` | Browse the database |
| `npm run seed` | Admin, settings, and sample products |

## Notes

- Sample product names, brands, specs, prices, and images are placeholders. Replace them with real products in Admin → Products.
- The rate limiter is in-memory. On serverless hosting, swap it for Upstash Ratelimit for real protection.
