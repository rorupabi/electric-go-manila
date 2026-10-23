import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { AuthCard, safeNext } from '@/components/auth-card';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getSessionUser().catch(() => null)) redirect(next);
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to check out and track your orders."
      footer={<>New here? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand hover:underline">Create an account</Link></>}
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
