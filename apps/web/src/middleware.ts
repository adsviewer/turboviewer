import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { logger } from '@repo/logger';
import { z } from 'zod';
import { env, REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/config';

const publicPaths = ['/', '/sign-in', '/sign-up', '/forgot-password*', '/reset-password*', '/api/login*'];

const isPublic = (path: string): boolean => {
  return Boolean(publicPaths.find((x) => new RegExp(`^${x}$`.replace('*$', '($|/)')).exec(path)));
};

const signOut = (request: NextRequest): NextResponse => {
  const signOutUrl = new URL('/sign-out', request.url);
  return NextResponse.redirect(signOutUrl);
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;

  if (request.nextUrl.pathname !== '/sign-out' && token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(env.AUTH_SECRET));
    } catch (err) {
      return tryRefreshToken(err, refreshToken, request);
    }
  }

  if (isPublic(request.nextUrl.pathname)) {
    if (token) {
      const redirectUrl = new URL('/placements', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (!token) {
    const signInUrl = new URL('/sign-in', env.PUBLIC_ENDPOINT);
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

const tryRefreshToken = async (
  err: unknown,
  refreshToken: string | undefined,
  request: NextRequest,
): Promise<NextResponse> => {
  if (err && typeof err === 'object' && 'code' in err && err.code === 'ERR_JWT_EXPIRED' && refreshToken) {
    logger.info('Refreshing token');
    const schema = z.object({
      data: z.object({
        refreshToken: z.string(),
      }),
    });
    const newRefreshToken = await fetch(env.GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ query: 'mutation {refreshToken}' }),
    })
      .then((response) => response.json())
      .catch((error: unknown) => {
        logger.error(error);
      })
      .then((json) => schema.safeParse(json));

    if (newRefreshToken.success) {
      const response = NextResponse.redirect(request.url);
      response.cookies.set(TOKEN_KEY, newRefreshToken.data.data.refreshToken);
      return response;
    }
    return signOut(request);
  }
  logger.error(err);
  return signOut(request);
};
