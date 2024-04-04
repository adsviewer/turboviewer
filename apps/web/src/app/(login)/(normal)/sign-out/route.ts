import { logger } from '@repo/logger'; // defaults to auto
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/config';

export const dynamic = 'force-dynamic';

export function GET(): never {
  logger.info('Signing out');
  cookies().delete(TOKEN_KEY);
  cookies().delete(REFRESH_TOKEN_KEY);
  return redirect('/sign-in');
}
