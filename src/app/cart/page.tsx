import type { Metadata } from 'next';
import { CartView } from './cart-view';

export const metadata: Metadata = { title: 'Cart' };

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>
      <CartView />
    </div>
  );
}
