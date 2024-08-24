import { cookies } from 'next/headers';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { env } from '@/env.mjs';

export const GET = (request: NextRequest): void => {
  const token = request.nextUrl.searchParams.get(TOKEN_KEY);
  const refreshToken = request.nextUrl.searchParams.get(REFRESH_TOKEN_KEY);
  const cookieStore = cookies();
  if (token) cookieStore.set(TOKEN_KEY, token);
  if (refreshToken) cookieStore.set(REFRESH_TOKEN_KEY, refreshToken);
  redirect(env.BACKOFFICE_URL);
};
