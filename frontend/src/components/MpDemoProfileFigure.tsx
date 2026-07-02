'use client';

import Image from 'next/image';
import { demoContent } from '@/lib/demoContent';

type Variant = 'heroMobile' | 'heroDesktop' | 'about';

const innerByVariant: Record<Variant, { objectPosition: string }> = {
  heroMobile: { objectPosition: 'object-top' },
  heroDesktop: { objectPosition: 'object-top' },
  about: { objectPosition: 'object-top' },
};

export default function MpDemoProfileFigure({
  variant,
  className = '',
}: {
  variant: Variant;
  className?: string;
}) {
  const { objectPosition } = innerByVariant[variant];

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      role="img"
      aria-label={demoContent.mp.profileImageAlt}
    >
      <Image
        src="/images/mp-profile.png"
        alt={demoContent.mp.profileImageAlt}
        fill
        priority={variant === 'heroMobile'}
        sizes="(max-width: 1024px) 340px, 400px"
        className={`object-cover ${objectPosition}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-npp-blue-dark/40 via-transparent to-transparent pointer-events-none" />
      <span className="sr-only">{demoContent.mp.profileImageAlt}</span>
    </div>
  );
}
