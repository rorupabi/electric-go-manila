import Link from 'next/link';

export const SHOP_NAME = 'Electric Go Manila';
export const MOTTO = 'Ride clean. Ride Manila.';
export const SUBLINE = 'Save the environment. Save on fuel.';

/**
 * "GO / electric / MANILA" wordmark, redrawn as SVG from the brand logo: the G doubles as a
 * scooter, with the stem and handlebar rising from its top. Letter shapes are paths (not a font)
 * so the mark looks the same everywhere; "electric" and "MANILA" use the site font.
 */
export function Logo({ inverted = false, className = '' }: { inverted?: boolean; className?: string }) {
  const main = inverted ? '#ffffff' : 'var(--brand)';
  const accent = inverted ? 'var(--volt)' : 'var(--night)';
  return (
    <svg viewBox="0 0 200 132" role="img" aria-label={SHOP_NAME} className={className}>
      {/* G: a thick open ring with a crossbar */}
      <path d="M 82.1 23.1 A 22 22 0 1 0 89.9 41.9" fill="none" stroke={main} strokeWidth="15" strokeLinecap="butt" />
      <path d="M 70 45 H 90" stroke={main} strokeWidth="12" />
      {/* scooter stem + handlebar, continuing out of the G's top end (roughly along its radius) */}
      <path d="M 80.5 26 L 90 6 H 106" fill="none" stroke={main} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {/* O, with a small gap after the G like the original */}
      <circle cx="132" cy="40" r="22" fill="none" stroke={main} strokeWidth="15" />
      <text x="100" y="99" textAnchor="middle" fontSize="40" fontWeight="300" letterSpacing="0.5" fill={main} style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
        electric
      </text>
      {/* letter-spacing trails the last letter, so shift right by half of it to stay centred */}
      <text x="104.5" y="127" textAnchor="middle" fontSize="19" fontWeight="700" letterSpacing="9" fill={accent} style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
        MANILA
      </text>
    </svg>
  );
}

export function BrandMark({ inverted = false, size = 'md' }: { inverted?: boolean; size?: 'md' | 'lg' }) {
  return (
    <Link href="/" className="flex min-h-11 items-center" aria-label={`${SHOP_NAME} home`}>
      <Logo inverted={inverted} className={size === 'lg' ? 'h-20 w-auto' : 'h-14 w-auto'} />
    </Link>
  );
}
