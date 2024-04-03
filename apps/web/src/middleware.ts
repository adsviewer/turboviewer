import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { logger } from '@repo/logger';
import { env, TOKEN_KEY } from '@/config';

const publicPaths = ['/', '/sign-in', '/sign-up', '/forgot-password*', '/reset-password*'];

const isPublic = (path: string): boolean => {
  return Boolean(publicPaths.find((x) => new RegExp(`^${x}$`.replace('*$', '($|/)')).exec(path)));
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (request.nextUrl.pathname !== '/sign-out' && token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(env.AUTH_SECRET));
    } catch (err) {
      logger.error(err);
      const signOutUrl = new URL('/sign-out', request.url);
      return NextResponse.redirect(signOutUrl);
    }
  }

  if (isPublic(request.nextUrl.pathname)) {
    if (token) {
      const redirectUrl = new URL('/profile', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (!token) {
    const signInUrl = new URL('/sign-in', env.NEXT_PUBLIC_ENDPOINT);
    signInUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Stop Middleware running on static files and public folder
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public folder
     */
    '/((?!static|.*\\..*|_next|favicon.ico).*)',
    '/',
  ],
};
