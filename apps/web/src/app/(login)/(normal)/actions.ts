'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/config';

export const signOut = (): void => {
  cookies().delete(TOKEN_KEY);
  cookies().delete(REFRESH_TOKEN_KEY);
  redirect('/sign-in');
};
