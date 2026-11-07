import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Validates whether the given JWT token string has a valid shape and has not expired.
 */
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

/**
 * Declarative Route Policy (Zero-Trust Architecture)
 *
 * Rather than maintaining an ad-hoc, hardcoded list of every plugin's private URLs
 * (which violates the Open/Closed Principle and leaks domain knowledge into gateway middleware),
 * CampusOS enforces Secure-by-Default (Default-Deny) access control:
 *
 * 1. Public Routes: Explicitly unauthenticated (landing, APIs, static assets).
 * 2. Guest-Only Routes: Auth entrypoints (/login, /signup, etc.) - redirects authenticated users to /dashboard.
 * 3. Protected Routes: All other application and modular plugin pages require an active session.
 */
const GUEST_ONLY_ROUTES = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password'
]);

const PUBLIC_EXACT_ROUTES = new Set(['/', '/logout']);

const PUBLIC_PREFIXES = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/static',
  '/images'
];

const routePolicy = {
  isGuestOnly(pathname: string): boolean {
    return GUEST_ONLY_ROUTES.has(pathname);
  },
  isPublic(pathname: string): boolean {
    if (PUBLIC_EXACT_ROUTES.has(pathname)) return true;
    return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  },
  isProtected(pathname: string): boolean {
    return !this.isPublic(pathname) && !this.isGuestOnly(pathname);
  }
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('campusos_access_token')?.value;
  const hasValidToken = isTokenValid(token);

  // 1. Protected routes: redirect unauthenticated visitors to login
  if (routePolicy.isProtected(pathname) && !hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const response = NextResponse.redirect(url);
    if (token) {
      response.cookies.delete('campusos_access_token');
    }
    return response;
  }

  // 2. Guest-only routes: redirect already-authenticated users to dashboard
  if (routePolicy.isGuestOnly(pathname) && hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Next.js Edge Runtime Matcher
 *
 * Directs all application routes through the middleware while bypassing static assets,
 * images, and media files for optimal edge performance.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
};
