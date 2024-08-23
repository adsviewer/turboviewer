'use server';

import { cookies } from 'next/headers';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { type MeQuery, type RefreshTokenQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk, urqlClientSdkRefresh } from '@/lib/urql/urql-client';

export async function getUserDetails(): Promise<MeQuery['me']> {
  return (await urqlClientSdk().me()).me;
}

export async function refreshJWTToken(): Promise<RefreshTokenQuery> {
  return await urqlClientSdkRefresh().refreshToken();
}

export const changeJWT = async (token: string, refreshToken?: string): Promise<void> => {
  cookies().set(TOKEN_KEY, token);
  if (refreshToken) {
    cookies().set(REFRESH_TOKEN_KEY, refreshToken);
  }
  return Promise.resolve();
};
