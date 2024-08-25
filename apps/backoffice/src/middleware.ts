import { z } from 'zod';
import { decodeJwt, jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@repo/logger';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { type AJwtPayload } from '@repo/shared-types';
import { env } from './env.mjs';
import { AllRoles, UserStatus } from './graphql/generated/schema-server';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
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

  // If user is not admin redirect to web app and sign the user out
  if (!token || !tokenData?.roles?.includes(AllRoles.ADMIN) || tokenData.userStatus === UserStatus.EMAIL_UNCONFIRMED) {
    const redirectUrl = new URL(`${env.NEXT_WEBAPP_ENDPOINT}/api/auth/sign-out`, request.url);
    redirectUrl.searchParams.set('redirect', env.BACKOFFICE_URL);
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
  return NextResponse.next();
}

const signOut = (request: NextRequest): NextResponse => {
  const signOutUrl = new URL('api/sign-out', request.url);
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
