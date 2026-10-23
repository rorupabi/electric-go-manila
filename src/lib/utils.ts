import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
export function formatPHP(amount: number): string {
  return peso.format(amount);
}

export function formatDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' })
    .format(typeof d === 'string' ? new Date(d) : d);
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** PH mobile number as 10 digits starting with 9 (e.g. 9171234567), or '' if not one. */
export function normalizePhMobile(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('63')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');
  return /^9\d{9}$/.test(digits) ? digits : '';
}

export function displayPhone(local: string | null | undefined): string {
  return local ? `+63 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : '';
}

/** Turns API error bodies into a sentence a customer can act on. */
const MESSAGES: Record<string, string> = {
  unauthenticated: 'Please sign in to continue.',
  forbidden: 'You do not have permission to do that.',
  not_found: 'We could not find that. Refresh and try again.',
  rate_limited: 'Too many attempts. Try again in a few minutes.',
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed: 'Confirm your email first. Check your inbox for the code.',
  email_in_use: 'That email is already registered. Sign in instead.',
  invalid_otp: 'That code is wrong or expired. Request a new one.',
  auth_not_configured: 'Sign-in is not set up yet. Try again later.',
  out_of_stock: 'Some items just sold out or have fewer units left. Review your cart.',
  cart_empty: 'Your cart is empty.',
  invalid_file: 'That file type or size is not allowed.',
  too_many_photos: 'Maximum 6 photos per product.',
  slug_in_use: 'Another product already uses that name. Change the name slightly.',
  bad_status: 'This order cannot do that in its current status.',
  reason_required: 'Add a reason so the customer knows what to fix.',
  has_orders: 'This product has orders. Set it to Draft instead of deleting.',
  server_error: 'Something went wrong. Try again.',
};

export function apiErrorMessage(body: unknown, fallback = 'Something went wrong. Try again.'): string {
  const json = (body && typeof body === 'object' ? body : {}) as { error?: string; issues?: { message?: string }[] };
  if (json.error === 'invalid_input') return json.issues?.[0]?.message || 'Please check the form and try again.';
  return (json.error && MESSAGES[json.error]) || fallback;
}

export const NETWORK_ERROR = 'Could not reach the server. Try again.';

export const PASSWORD_HINT = 'Use 8+ characters with uppercase, lowercase, a number, and a symbol.';
export function passwordOk(p: string): boolean {
  return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);
}
