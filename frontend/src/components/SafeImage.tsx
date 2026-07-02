'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { mediaUrl } from '@/lib/mediaUrl';

type SafeImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  category?: string;
  placeholderClassName?: string;
};

export default function SafeImage({
  src,
  alt,
  className = '',
  category,
  placeholderClassName = '',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = mediaUrl(src);

  if (!resolved || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-npp-blue/10 via-gray-50 to-npp-red/10 text-npp-blue/50 ${placeholderClassName || className}`}
        aria-hidden={!alt}
      >
        <ImageIcon size={28} strokeWidth={1.25} className="mb-1 opacity-70" />
        {category ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{category}</span>
        ) : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
