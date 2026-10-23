import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const CATEGORIES = [
  { code: 'kick_scooter', label: 'Electric kick scooters', short: 'Kick scooters' },
  { code: 'ebike', label: 'Pedal-assist e-bikes', short: 'E-bikes' },
] as const;
export type CategoryCode = (typeof CATEGORIES)[number]['code'];

/** Price/feature level, cheapest first. Drives the "Entry / Mid / High" menus and filters. */
export const TIERS = [
  { code: 'entry', label: 'Entry level', hint: 'Easy first ride, budget friendly' },
  { code: 'mid', label: 'Mid-range', hint: 'More range and comfort for daily commutes' },
  { code: 'high', label: 'High-end', hint: 'Top power, range, and build quality' },
] as const;
export type TierCode = (typeof TIERS)[number]['code'];

export type UserRole = 'customer' | 'admin';
export type ProductStatus = 'active' | 'draft';
export type OrderStatus = 'awaiting_payment' | 'payment_review' | 'paid' | 'ready' | 'completed' | 'cancelled';
export type Fulfillment = 'pickup' | 'delivery';
export type ReceiptStatus = 'pending' | 'approved' | 'rejected';

export type ProductSpecs = {
  rangeKm?: number;
  topSpeedKph?: number;
  batteryWh?: number;
  motorW?: number;
  weightKg?: number;
  maxLoadKg?: number;
  chargeHours?: number;
  wheelSize?: string;
};

/** App profile for a Supabase Auth user (same id). */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('customer').$type<UserRole>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('users_email_unique').on(t.email),
  check('users_role_chk', sql`${t.role} IN ('customer','admin')`),
]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull().$type<CategoryCode>(),
  tier: text('tier').notNull().default('entry').$type<TierCode>(),
  pricePhp: integer('price_php').notNull(),
  compareAtPhp: integer('compare_at_php'),
  stock: integer('stock').notNull().default(0),
  description: text('description').notNull().default(''),
  specs: jsonb('specs').notNull().default({}).$type<ProductSpecs>(),
  status: text('status').notNull().default('active').$type<ProductStatus>(),
  featured: integer('featured').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('products_slug_unique').on(t.slug),
  index('products_category_idx').on(t.category, t.status),
  check('products_category_chk', sql`${t.category} IN ('kick_scooter','ebike')`),
  check('products_tier_chk', sql`${t.tier} IN ('entry','mid','high')`),
  check('products_status_chk', sql`${t.status} IN ('active','draft')`),
  check('products_price_chk', sql`${t.pricePhp} > 0`),
  // Stock can never go negative, even if two checkouts race for the last unit.
  check('products_stock_chk', sql`${t.stock} >= 0`),
]);

export const productPhotos = pgTable('product_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('product_photos_product_idx').on(t.productId, t.sortOrder)]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: text('number').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('awaiting_payment').$type<OrderStatus>(),
  fulfillment: text('fulfillment').notNull().$type<Fulfillment>(),
  contactName: text('contact_name').notNull(),
  contactPhone: text('contact_phone').notNull(),
  address: text('address'),
  notes: text('notes'),
  subtotalPhp: integer('subtotal_php').notNull(),
  deliveryFeePhp: integer('delivery_fee_php').notNull().default(0),
  totalPhp: integer('total_php').notNull(),
  cancelledReason: text('cancelled_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('orders_number_unique').on(t.number),
  index('orders_user_idx').on(t.userId, t.createdAt),
  index('orders_status_idx').on(t.status, t.createdAt),
  check('orders_status_chk', sql`${t.status} IN ('awaiting_payment','payment_review','paid','ready','completed','cancelled')`),
  check('orders_fulfillment_chk', sql`${t.fulfillment} IN ('pickup','delivery')`),
]);

/** Name and price are copied at checkout so later product edits never change past orders. */
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  unitPricePhp: integer('unit_price_php').notNull(),
  quantity: integer('quantity').notNull(),
}, (t) => [
  index('order_items_order_idx').on(t.orderId),
  check('order_items_qty_chk', sql`${t.quantity} > 0`),
]);

export const paymentReceipts = pgTable('payment_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  referenceNumber: text('reference_number'),
  status: text('status').notNull().default('pending').$type<ReceiptStatus>(),
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('payment_receipts_order_idx').on(t.orderId, t.submittedAt),
  check('payment_receipts_status_chk', sql`${t.status} IN ('pending','approved','rejected')`),
]);

export const SHOP_SETTINGS_ID = 'shop';

export const shopSettings = pgTable('shop_settings', {
  id: text('id').primaryKey(),
  gcashName: text('gcash_name'),
  gcashNumber: text('gcash_number'),
  mayaName: text('maya_name'),
  mayaNumber: text('maya_number'),
  bankName: text('bank_name').default('BPI'),
  bankAccountName: text('bank_account_name'),
  bankAccountNumber: text('bank_account_number'),
  pickupAddress: text('pickup_address'),
  deliveryFeePhp: integer('delivery_fee_php').notNull().default(300),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
