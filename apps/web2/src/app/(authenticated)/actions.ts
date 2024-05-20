'use server';

import { type MeQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export async function getUserDetails(): Promise<MeQuery['me']> {
  return (await urqlClientSdk().me()).me;
}
