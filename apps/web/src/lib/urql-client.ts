import { cacheExchange, type Client, createClient, fetchExchange } from '@urql/core';
import { createUrqlRequester } from '../util/create-urql-requester';
import { getSdk } from '../graphql/generated/schema-server';
import { env } from '../config';

const makeClient = (): Client => {
  return createClient({
    url: env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
    exchanges: [cacheExchange, fetchExchange],
  });
};

export const urqlClientSdk = getSdk(createUrqlRequester(makeClient()));
