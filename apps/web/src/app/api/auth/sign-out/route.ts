import { cookies } from 'next/headers';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { env } from '@/env.mjs';

export async function GET(request: NextRequest): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
  const url = new URL(`${env.NEXT_PUBLIC_ENDPOINT}/sign-in`);
  const redirectUrl = request.nextUrl.searchParams.get('redirect');
  if (redirectUrl) {
    url.searchParams.set('redirect', redirectUrl);
  }
  redirect(url.toString());
}
