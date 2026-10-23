import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <div className="card">
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="We could not find that page."
          hint="The link may be old, or the product was removed."
          action={<><Link href="/shop" className="btn btn-primary">Browse the shop</Link><Link href="/" className="btn btn-outline">Go home</Link></>}
        />
      </div>
    </div>
  );
}
