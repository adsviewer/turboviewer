import { cacheExchange, type Client, createClient, fetchExchange } from '@urql/core';
import { cookies } from 'next/headers';
// eslint-disable-next-line import/named -- this should work
import { cache } from 'react';
import { createUrqlRequester } from '@/util/create-urql-requester';
import { getSdk } from '@/graphql/generated/schema-server';
import { env, TOKEN_KEY } from '@/config';
import { makeAuthExchange } from '@/lib/urql/urql-auth';

const makeClient = (): Client => {
  const token = cookies().get(TOKEN_KEY)?.value;
  return createClient({
    url: env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
    exchanges: [cacheExchange, makeAuthExchange(token), fetchExchange],
    // We may need to add this back in if we run into issues with caching
    // fetchOptions: { cache: 'no-store' },
  });
};

export const urqlClientSdk = cache(() => getSdk(createUrqlRequester(makeClient())));
