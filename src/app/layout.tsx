import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { CartProvider } from '@/components/cart';
import { SiteHeader } from '@/components/site-header';
import { BrandMark, MOTTO, SHOP_NAME, SUBLINE } from '@/components/brand';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: `${SHOP_NAME} · ${MOTTO}`, template: `%s · ${SHOP_NAME}` },
  description: 'Electric kick scooters and pedal-assist e-bikes in Metro Manila. Skip the fuel, skip the traffic.',
};

export const viewport: Viewport = { themeColor: '#15803d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="bg-night text-white/80">
            <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
              <div className="space-y-3">
                <BrandMark inverted size="lg" />
                <p className="text-sm font-semibold text-volt">{MOTTO}</p>
                <p className="text-sm">{SUBLINE}</p>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-white">Shop</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/shop?category=kick_scooter" className="hover:text-volt">Electric kick scooters</Link></li>
                  <li><Link href="/shop?category=ebike" className="hover:text-volt">Pedal-assist e-bikes</Link></li>
                  <li><Link href="/shop" className="hover:text-volt">All products</Link></li>
                </ul>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-white">Account</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/orders" className="hover:text-volt">My orders</Link></li>
                  <li><Link href="/cart" className="hover:text-volt">Cart</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10">
              <p className="container-page py-4 text-xs text-white/50">© {new Date().getFullYear()} {SHOP_NAME}. Metro Manila, Philippines.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
