'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="container-page py-16">
      <div className="card">
        <EmptyState
          icon={<TriangleAlert className="h-6 w-6" />}
          title="Something went wrong on this page."
          hint="Try again. If it keeps happening, come back in a few minutes."
          action={<><button type="button" onClick={() => retry()} className="btn btn-primary">Try again</button><Link href="/" className="btn btn-outline">Go home</Link></>}
        />
      </div>
    </div>
  );
}
