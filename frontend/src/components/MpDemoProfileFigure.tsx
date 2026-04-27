'use client';

import { Landmark } from 'lucide-react';
import { demoContent } from '@/lib/demoContent';

type Variant = 'heroMobile' | 'heroDesktop' | 'about';

const innerByVariant: Record<
  Variant,
  { icon: number; gradient: string; ring?: string }
> = {
  heroMobile: {
    icon: 72,
    gradient: 'bg-gradient-to-b from-ghana-green-dark via-ghana-green to-ghana-green-light',
  },
  heroDesktop: {
    icon: 96,
    gradient: 'bg-gradient-to-b from-ghana-green-dark via-ghana-green to-ghana-green-light',
  },
  about: {
    icon: 88,
    gradient: 'bg-gradient-to-br from-ghana-green-dark via-ghana-green to-ghana-green-light',
  },
};

export default function MpDemoProfileFigure({
  variant,
  className = '',
}: {
  variant: Variant;
  className?: string;
}) {
  const { icon, gradient } = innerByVariant[variant];

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center ${gradient} ${className}`}
      role="img"
      aria-label={demoContent.mp.profileImageAlt}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.08)_0%,_transparent_55%)] pointer-events-none" />
      <Landmark
        size={icon}
        strokeWidth={1.15}
        className="text-ghana-gold relative z-[1] drop-shadow-md opacity-[0.92]"
        aria-hidden
      />
      <span className="sr-only">{demoContent.mp.profileImageAlt}</span>
    </div>
  );
}
