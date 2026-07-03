import { proxyToBackend } from '@/lib/backendProxy';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(req: Request, ctx: RouteContext) {
  const { path } = await ctx.params;
  try {
    return await proxyToBackend(req, `/api/${path.join('/')}`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Backend unavailable';
    console.error('[api proxy]', detail, err instanceof Error && 'cause' in err ? (err as Error & { cause?: unknown }).cause : '');
    return Response.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
