import Image from 'next/image';
import { Bike, Zap } from 'lucide-react';

/** Product photo with a branded fallback when no photo has been uploaded yet. Lazy-loads by default. */
export function ProductImage({ src, alt, category, sizes, priority = false }: {
  src: string | null;
  alt: string;
  category: string;
  sizes: string;
  priority?: boolean;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-surface-soft to-[#dcefe1] text-brand/60" aria-label={alt} role="img">
      {category === 'ebike' ? <Bike className="h-14 w-14" aria-hidden /> : <Zap className="h-14 w-14" aria-hidden />}
    </div>
  );
}
