import { z } from 'zod';
import { jwtVerify, decodeJwt, type JWTPayload } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@repo/logger';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@repo/utils';
import { type AJwtPayload } from '@repo/shared-types';
import { env } from './env.mjs';
import { fetchPreviewsKey, groupedByKey } from './util/url-query-utils';
import { InsightsColumnsGroupBy, UserStatus } from './graphql/generated/schema-server';

const defaultMissingOrgURL = '/organization-warning';
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
  let tokenData: AJwtPayload | undefined;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(env.AUTH_SECRET));
      tokenData = decodeJwt(token) as AJwtPayload;
    } catch (error: unknown) {
      logger.error(error);
    }
  }

  // If user has not confirmed their email, redirect to confirm email hint page
  if (token && request.nextUrl.pathname !== '/confirm-email') {
    if (tokenData?.userStatus === UserStatus.EMAIL_UNCONFIRMED) {
      const redirectUrl = new URL('/confirm-email', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // In case of token in URL (e.g. during Google auth or email confirmation or org switch), set JWT token & redirect to insights
  if (request.nextUrl.searchParams.get(TOKEN_KEY) && request.nextUrl.searchParams.get(REFRESH_TOKEN_KEY)) {
    const redirectUrl = getDefaultRedirectURL(request, tokenData);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(TOKEN_KEY, request.nextUrl.searchParams.get(TOKEN_KEY) ?? 'error');
    response.cookies.set(REFRESH_TOKEN_KEY, request.nextUrl.searchParams.get(REFRESH_TOKEN_KEY) ?? 'error');
    return response;
  }

  // Redirect to correct route if visiting the root url
  if (request.nextUrl.pathname === '/') {
    if (token) {
      const redirectUrl = getDefaultRedirectURL(request, tokenData);
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

  // If attempting to visit a public URL or the defaultMissingOrgURL while already signed in, redirect to default page
  if (isPublic(request.nextUrl.pathname) && token) {
    const redirectUrl = getDefaultRedirectURL(request, tokenData);
    return NextResponse.redirect(redirectUrl);
  }

  // If attempting to visit an authenticated URL without a JWT, redirect to sign in
  // & after successful sign in, redirect to the desired page
  if (!isPublic(request.nextUrl.pathname) && !token) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  // (Insights only) If page is loaded without any query params, set the following initial group filters
  if (request.nextUrl.pathname === '/insights' && !request.nextUrl.search) {
    const newURL = `/insights?${groupedByKey}=${InsightsColumnsGroupBy.adId}&${groupedByKey}=${InsightsColumnsGroupBy.device}&${groupedByKey}=${InsightsColumnsGroupBy.publisher}&${groupedByKey}=${InsightsColumnsGroupBy.position}&${fetchPreviewsKey}=true`;
    const redirectUrl = new URL(newURL, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user has no current org, redirect to defaultMissingOrgURL
  if (
    tokenData &&
    !tokenData.organizationId &&
    request.nextUrl.pathname !== '/sign-out' &&
    request.nextUrl.pathname !== defaultMissingOrgURL
  ) {
    const redirectUrl = new URL(defaultMissingOrgURL, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user has a current org and tries to visit the missing org screen, redirect to insights
  if (request.nextUrl.pathname === defaultMissingOrgURL && tokenData?.organizationId) {
    const redirectUrl = new URL('/insights', request.url);
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
      body: JSON.stringify({ query: 'query {refreshToken}' }),
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

// The default redirect is on insights, but if no current org exists then the user should be redirected to the org warning page
const getDefaultRedirectURL = (request: NextRequest, tokenData: JWTPayload | undefined): URL => {
  if (tokenData?.organizationId) {
    return new URL('/insights', request.url);
  }
  return new URL(defaultMissingOrgURL, request.url);
};

const isPublic = (path: string): boolean => {
  return publicPaths.includes(path);
};

// const isAPIRequest = (path: string): boolean => {
//   return path.startsWith('/api');
// };
