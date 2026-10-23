import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthCard, safeNext } from '@/components/auth-card';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create account' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  return (
    <AuthCard
      title="Create your account"
      subtitle="We will email you a code to confirm it is you."
      footer={<>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand hover:underline">Sign in</Link></>}
    >
      <RegisterForm next={next} />
    </AuthCard>
  );
}
