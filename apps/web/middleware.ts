import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/demo'];

const ROLE_PREFIXES: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  PATIENT: '/patient',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read auth from localStorage is not possible in middleware (server-side)
  // We use a cookie approach: set a non-httponly cookie with role for routing
  const authCookie = request.cookies.get('auth-role')?.value;

  if (!authCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const role = authCookie as keyof typeof ROLE_PREFIXES;
  const allowedPrefix = ROLE_PREFIXES[role];

  if (!allowedPrefix) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin can access everything
  if (role === 'ADMIN') return NextResponse.next();

  // Check if user tries to access another role's routes
  const otherRoles = Object.entries(ROLE_PREFIXES).filter(([r]) => r !== role);
  for (const [, prefix] of otherRoles) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
