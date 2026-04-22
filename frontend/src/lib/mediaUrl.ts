/**
 * Resolves media URLs for images served from the Express API (`/uploads/...`).
 * Uploaded files stay on the server disk — no external CDN required.
 * Absolute http(s) URLs (e.g. legacy Unsplash) are returned unchanged.
 */
export function getApiOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5001`;
  }
  return (process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:5001').replace(/\/$/, '');
}

export function mediaUrl(src: string | null | undefined): string {
  if (!src) return '';
  const s = src.trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${getApiOrigin()}${s}`;
  return s;
}
