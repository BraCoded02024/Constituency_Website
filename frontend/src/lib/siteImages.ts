import type { StaticImageData } from 'next/image';
import heroElephantLocal from '@/assets/npp-hero-elephant.png';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Build a Cloudinary delivery URL from a public ID (upload to Media Library first). */
export function cloudinaryImage(publicId: string): string | null {
  if (!cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}

/** NPP flag — env override, Cloudinary, or local public folder. */
export const NPP_FLAG_SRC: string =
  process.env.NEXT_PUBLIC_NPP_FLAG_URL ||
  cloudinaryImage('constituency-cms/branding/npp-flag') ||
  '/images/npp-flag.png';

/** Hero elephant — env override, Cloudinary, or bundled asset. */
export const HERO_ELEPHANT_SRC: string | StaticImageData =
  process.env.NEXT_PUBLIC_HERO_ELEPHANT_URL ||
  cloudinaryImage('constituency-cms/branding/npp-hero-elephant') ||
  heroElephantLocal;

/** True when src is a remote URL (Cloudinary, Unsplash, etc.). */
export function isRemoteImageSrc(src: string | StaticImageData): src is string {
  return typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));
}
