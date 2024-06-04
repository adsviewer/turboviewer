import { z } from 'zod';
import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@repo/logger';
import { env, REFRESH_TOKEN_KEY, TOKEN_KEY } from './env.mjs';
import { groupedByKey } from './util/url-query-utils';
import { InsightsColumnsGroupBy } from './graphql/generated/schema-server';

const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password-pending',
  '/reset-password',
  '/api/auth/sign-in',
  '/api/auth/sign-up',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

// Stop Middleware running on static files and public folder
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next (static files & image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!_next|favicon.ico).*)',
//   ],
// };

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;

  // Redirect to correct route if visiting the root url
  if (request.nextUrl.pathname === '/') {
    if (token) {
      const redirectUrl = new URL('/insights', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    const redirectUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Refresh user's JWT if invalid (except if signing out)
  if (request.nextUrl.pathname !== '/sign-out' && token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(env.AUTH_SECRET));
    } catch (err) {
      return tryRefreshToken(err, refreshToken, request);
    }
  }

  // If attempting to visit a public URL while already signed in, redirect to insights
  if (isPublic(request.nextUrl.pathname) && token) {
    const redirectUrl = new URL('/insights', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If attempting to visit an authenticated URL without a JWT, redirect to sign in
  // & after successful sign in, redirect to the desired page
  if (!isPublic(request.nextUrl.pathname) && !token) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  // If page is loaded without any query params, set the following initial group filters
  if (request.nextUrl.pathname === '/insights' && !request.nextUrl.search) {
    const newURL = `/insights?${groupedByKey}=${InsightsColumnsGroupBy.adId}&${groupedByKey}=${InsightsColumnsGroupBy.device}&${groupedByKey}=${InsightsColumnsGroupBy.publisher}&${groupedByKey}=${InsightsColumnsGroupBy.position}`;
    const redirectUrl = new URL(newURL, request.url);
    logger.info(redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

const signOut = (request: NextRequest): NextResponse => {
  const signOutUrl = new URL('/sign-out', request.url);
  signOutUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signOutUrl);
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
    const newRefreshToken = await fetch(env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT, {
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

const isPublic = (path: string): boolean => {
  return publicPaths.includes(path);
};

// const isAPIRequest = (path: string): boolean => {
//   return path.startsWith('/api');
// };
