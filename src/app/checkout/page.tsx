import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getShopSettings } from '@/lib/catalog';
import { CheckoutForm } from './checkout-form';

export const metadata: Metadata = { title: 'Checkout' };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/checkout');
  const settings = await getShopSettings();
  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Checkout</h1>
      <CheckoutForm
        defaults={{ name: user.name, phone: user.phone ?? '' }}
        deliveryFeePhp={settings.deliveryFeePhp}
        pickupAddress={settings.pickupAddress}
      />
    </div>
  );
}
