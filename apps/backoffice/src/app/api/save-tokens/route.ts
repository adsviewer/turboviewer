import { cookies } from 'next/headers';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { logger } from '@repo/logger';
import { env } from '@/env.mjs';

export const GET = async (request: NextRequest): Promise<void> => {
  const token = request.nextUrl.searchParams.get(TOKEN_KEY);
  const refreshToken = request.nextUrl.searchParams.get(REFRESH_TOKEN_KEY);
  const cookieStore = await cookies();
  if (token) cookieStore.set(TOKEN_KEY, token);
  if (refreshToken) cookieStore.set(REFRESH_TOKEN_KEY, refreshToken);
  logger.info('Tokens saved');
  redirect(env.BACKOFFICE_URL);
};
