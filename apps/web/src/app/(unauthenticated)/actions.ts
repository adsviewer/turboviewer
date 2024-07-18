'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';

export const signOut = async (): Promise<void> => {
  cookies().delete(TOKEN_KEY);
  cookies().delete(REFRESH_TOKEN_KEY);
  redirect('/sign-in');
  return Promise.resolve();
};

export const changeJWT = async (token: string, refreshToken?: string): Promise<void> => {
  cookies().set(TOKEN_KEY, token);
  if (refreshToken) {
    cookies().set(REFRESH_TOKEN_KEY, refreshToken);
  }
  return Promise.resolve();
};
