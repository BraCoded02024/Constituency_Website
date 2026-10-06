import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { publicSiteEnabled } from '@/lib/permissions';

export function middleware(request: NextRequest) {
  if (publicSiteEnabled) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/admin')
    || pathname.startsWith('/api')
    || pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
