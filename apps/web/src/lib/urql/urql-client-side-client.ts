import { type Client, createClient } from '@urql/core';
import { env } from '@/env.mjs';
import { makeUrqlClientOptions } from '@/lib/urql/urql-options';

export const urqlSubClient = (token: string | undefined, acceptedLanguage: string | null): Client => {
  return createClient(makeUrqlClientOptions(acceptedLanguage, token, env.NEXT_PUBLIC_GRAPHQL_ENDPOINT));
};
