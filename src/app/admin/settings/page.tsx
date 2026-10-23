import type { Metadata } from 'next';
import { getShopSettings } from '@/lib/catalog';
import { PageHeader } from '@/components/ui';
import { SettingsForm } from './settings-form';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const s = await getShopSettings();
  return (
    <>
      <PageHeader title="Shop settings" subtitle="Shown to customers on their order page." />
      <SettingsForm initial={{
        gcashName: s.gcashName ?? '', gcashNumber: s.gcashNumber ?? '', mayaName: s.mayaName ?? '',
        mayaNumber: s.mayaNumber ?? '', bankName: s.bankName ?? 'BPI', bankAccountName: s.bankAccountName ?? '',
        bankAccountNumber: s.bankAccountNumber ?? '', pickupAddress: s.pickupAddress ?? '', deliveryFeePhp: s.deliveryFeePhp,
      }} />
    </>
  );
}
