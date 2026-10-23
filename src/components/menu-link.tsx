'use client';

import Link from 'next/link';

/**
 * Link inside a menu: closes it after navigating. Drops focus (desktop focus-within dropdowns)
 * and closes the enclosing <details> (phone menu), since client navigation keeps the header mounted.
 */
export function MenuLink(props: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        e.currentTarget.closest('details')?.removeAttribute('open');
        (document.activeElement as HTMLElement | null)?.blur();
      }}
    />
  );
}
