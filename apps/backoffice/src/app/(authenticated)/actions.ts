'use server';

import { type AdAccountsQuery, type MeQuery, type RefreshTokenQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk, urqlClientSdkRefresh } from '@/lib/urql/urql-client';

export async function getUserDetails(): Promise<MeQuery['me']> {
  return (await urqlClientSdk().me()).me;
}

export default async function getAccounts(): Promise<AdAccountsQuery> {
  return await urqlClientSdk().adAccounts();
}

export async function refreshJWTToken(): Promise<RefreshTokenQuery> {
  return await urqlClientSdkRefresh().refreshToken();
}
