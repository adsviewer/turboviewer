import { cacheExchange, type ClientOptions, fetchExchange } from '@urql/core';
import { makeAuthExchange } from '@/lib/urql/urql-auth';

export const makeUrqlClientOptions = (
  acceptedLanguage: string | null,
  token: string | undefined,
  url: string,
): ClientOptions => ({
  url,
  fetchSubscriptions: true,
  fetchOptions: {
    headers: {
      'accept-language': acceptedLanguage ?? 'en-US',
    },
  },
  exchanges: [cacheExchange, makeAuthExchange(token), fetchExchange],
  // We may need to add this back in if we run into issues with caching
  // fetchOptions: { cache: 'no-store' },
});
