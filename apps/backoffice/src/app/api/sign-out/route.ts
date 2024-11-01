import { cookies } from 'next/headers';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { redirect } from 'next/navigation';
import { env } from '@/env.mjs';

export async function GET(_request: Request): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
  redirect(`${env.NEXT_WEBAPP_ENDPOINT}/sign-in`);
}
