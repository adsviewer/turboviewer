'use server';

import { type AdAccountsQuery, type MeQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export async function getUserDetails(): Promise<MeQuery['me']> {
  return (await urqlClientSdk().me()).me;
}

export default async function getAccounts(): Promise<AdAccountsQuery> {
  const accounts = await urqlClientSdk().adAccounts();
  return accounts;
}
