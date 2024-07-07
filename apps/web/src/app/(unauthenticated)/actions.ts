'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';

export const signOut = (): void => {
  cookies().delete(TOKEN_KEY);
  cookies().delete(REFRESH_TOKEN_KEY);
  redirect('/sign-in');
};

export const changeJWT = async (token: string, refreshToken: string): Promise<void> => {
  cookies().set(TOKEN_KEY, token);
  cookies().set(REFRESH_TOKEN_KEY, refreshToken);
  return Promise.resolve();
};
