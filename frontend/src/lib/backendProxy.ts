function getBackendBase(): string {
  const internal = process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, '');
  if (internal) return internal;
  if (process.env.VERCEL) {
    throw new Error('BACKEND_INTERNAL_URL missing — redeploy after vercel.json services binding is active');
  }
  return 'http://localhost:5001';
}

export function backendUrl(path: string, search = ''): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getBackendBase()}${normalized}${search}`;
}

export async function proxyToBackend(req: Request, targetPath: string): Promise<Response> {
  const url = new URL(req.url);
  const target = backendUrl(targetPath, url.search);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'host') return;
    headers.set(key, value);
  });

  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
    init.duplex = 'half';
  }

  const res = await fetch(target, init);
  const outHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    outHeaders.set(key, value);
  });

  return new Response(res.body, { status: res.status, headers: outHeaders });
}
