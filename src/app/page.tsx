import Link from 'next/link';
import { ArrowRight, BatteryCharging, Bike, Fuel, Leaf, ShieldCheck, Zap } from 'lucide-react';
import { listProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';
import { MOTTO, SUBLINE } from '@/components/brand';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const featured = await listProducts({ featuredOnly: true, limit: 6 }).catch(() => []);
  return (
    <>
      <section className="relative overflow-hidden bg-night text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-volt/15 blur-3xl" aria-hidden />
        <div className="container-page relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-volt">
              <Leaf className="h-3.5 w-3.5" aria-hidden /> {SUBLINE}
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              {MOTTO.split('. ')[0]}.<br /><span className="text-volt">{MOTTO.split('. ')[1]}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
              Electric kick scooters and pedal-assist e-bikes for the daily Manila commute. No gas station stops, no parking stress, just charge and go.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop?category=kick_scooter" className="btn btn-volt">Shop kick scooters <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href="/shop?category=ebike" className="btn border border-white/25 text-white hover:bg-white/10">Shop e-bikes</Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {[
              { icon: Fuel, title: '₱0 on gas', body: 'A full charge costs about the price of a soft drink.' },
              { icon: BatteryCharging, title: 'Charge at home', body: 'Plug into any regular outlet overnight.' },
              { icon: Zap, title: 'Beat traffic', body: 'Slip past the jam on short city trips.' },
              { icon: Leaf, title: 'Zero tailpipe', body: 'Cleaner air for every barangay you ride through.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Icon className="mb-3 h-6 w-6 text-volt" aria-hidden />
                <dt className="font-semibold">{title}</dt>
                <dd className="mt-1 text-sm text-white/65">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Pick your ride</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/shop?category=kick_scooter" className="card group flex items-center gap-5 p-6 transition hover:shadow-lg">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand text-volt"><Zap className="h-8 w-8" aria-hidden /></span>
            <span className="flex-1">
              <span className="block text-lg font-semibold group-hover:text-brand">Electric kick scooters</span>
              <span className="mt-1 block text-sm text-ink-soft">Foldable, light, and made for last-mile trips to the MRT, office, or school.</span>
            </span>
            <ArrowRight className="h-5 w-5 text-ink-soft group-hover:text-brand" aria-hidden />
          </Link>
          <Link href="/shop?category=ebike" className="card group flex items-center gap-5 p-6 transition hover:shadow-lg">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-night text-volt"><Bike className="h-8 w-8" aria-hidden /></span>
            <span className="flex-1">
              <span className="block text-lg font-semibold group-hover:text-brand">Pedal-assist e-bikes</span>
              <span className="mt-1 block text-sm text-ink-soft">Pedal like a normal bike, with a motor that makes the flyovers feel flat.</span>
            </span>
            <ArrowRight className="h-5 w-5 text-ink-soft group-hover:text-brand" aria-hidden />
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page pb-14">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Featured rides</h2>
            <Link href="/shop" className="text-sm font-semibold text-brand hover:underline">See all</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <section className="border-t border-border bg-surface">
        <div className="container-page grid gap-6 py-12 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Checked before handover', body: 'Every unit is test-ridden and charged before pickup or delivery.' },
            { icon: BatteryCharging, title: 'Simple payment', body: 'Pay by GCash, Maya, or BPI bank transfer, upload your receipt, and we confirm it.' },
            { icon: Bike, title: 'Pickup or delivery', body: 'Collect from our shop or get it delivered within Metro Manila.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <Icon className="h-6 w-6 shrink-0 text-brand" aria-hidden />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
