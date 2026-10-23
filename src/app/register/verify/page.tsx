import type { Metadata } from 'next';
import { AuthCard, safeNext } from '@/components/auth-card';
import { VerifyForm } from './verify-form';

export const metadata: Metadata = { title: 'Confirm your email' };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Check your email" subtitle={sp.email ? `We sent a code to ${sp.email}.` : 'Enter the code we emailed you.'}>
      <VerifyForm email={sp.email ?? ''} next={safeNext(sp.next)} />
    </AuthCard>
  );
}
