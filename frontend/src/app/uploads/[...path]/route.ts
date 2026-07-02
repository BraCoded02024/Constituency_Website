import { proxyToBackend } from '@/lib/backendProxy';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: RouteContext) {
  const { path } = await ctx.params;
  try {
    return await proxyToBackend(req, `/uploads/${path.join('/')}`);
  } catch {
    return new Response('File not found', { status: 404 });
  }
}
