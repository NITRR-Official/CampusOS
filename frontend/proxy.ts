import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenValid(token?: string): boolean {
  if (!token) return false;
  try {
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) return false;
    const payloadJson = atob(
      payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    );
    const payload = JSON.parse(payloadJson);
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('campusos_access_token')?.value;
  const hasValidToken = isTokenValid(token);

  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/participants') ||
    pathname.startsWith('/settings');

  if (isProtectedRoute && !hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/events/:path*',
    '/tasks/:path*',
    '/calendar/:path*',
    '/participants/:path*',
    '/settings/:path*',
    '/login',
    '/signup'
  ]
};
