import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('campusos_access_token')?.value;

  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/participants') ||
    pathname.startsWith('/settings');

  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
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
