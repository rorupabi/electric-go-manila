import { z } from 'zod';
import { normalizePhMobile, passwordOk, PASSWORD_HINT } from '@/lib/utils';

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(200);
const phone = z.string().transform(normalizePhMobile).refine((v) => v !== '', 'Enter a valid PH mobile number (e.g. 0917 123 4567).');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email,
  phone,
  password: z.string().max(72).refine(passwordOk, PASSWORD_HINT),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(72),
});

export const otpSchema = z.object({
  email,
  token: z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => /^\d{6,10}$/.test(v), 'Enter the code from your email.'),
});

export const emailOnlySchema = z.object({ email });

export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

export const placeOrderSchema = z.object({
  items: z.array(cartLineSchema).min(1, 'Your cart is empty.').max(20),
  fulfillment: z.enum(['pickup', 'delivery']),
  contactName: z.string().trim().min(2, 'Enter the name for this order.').max(100),
  contactPhone: phone,
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
}).refine((o) => o.fulfillment === 'pickup' || (o.address && o.address.length >= 10), {
  message: 'Enter a full delivery address (street, barangay, city).',
  path: ['address'],
});

const optionalNumber = z.number().nonnegative().max(100000).optional();

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(120),
  brand: z.string().trim().min(1, 'Brand is required.').max(80),
  category: z.enum(['kick_scooter', 'ebike']),
  tier: z.enum(['entry', 'mid', 'high']),
  pricePhp: z.number().int('Price must be a whole peso amount.').min(1, 'Price must be at least ₱1.').max(10_000_000),
  compareAtPhp: z.number().int().min(1).max(10_000_000).nullable().optional(),
  stock: z.number().int('Stock must be a whole number.').min(0, 'Stock cannot be negative.').max(100000),
  description: z.string().trim().max(4000).default(''),
  status: z.enum(['active', 'draft']),
  featured: z.boolean().default(false),
  specs: z.object({
    rangeKm: optionalNumber,
    topSpeedKph: optionalNumber,
    batteryWh: optionalNumber,
    motorW: optionalNumber,
    weightKg: optionalNumber,
    maxLoadKg: optionalNumber,
    chargeHours: optionalNumber,
    wheelSize: z.string().trim().max(40).optional(),
  }).default({}),
}).refine((p) => !p.compareAtPhp || p.compareAtPhp > p.pricePhp, {
  message: 'The "was" price must be higher than the selling price.',
  path: ['compareAtPhp'],
});

export const settingsSchema = z.object({
  gcashName: z.string().trim().max(100).optional(),
  gcashNumber: z.string().trim().max(20).optional(),
  mayaName: z.string().trim().max(100).optional(),
  mayaNumber: z.string().trim().max(20).optional(),
  bankName: z.string().trim().max(60).optional(),
  bankAccountName: z.string().trim().max(100).optional(),
  bankAccountNumber: z.string().trim().max(30).optional(),
  pickupAddress: z.string().trim().max(500).optional(),
  deliveryFeePhp: z.number().int().min(0).max(100000),
});
