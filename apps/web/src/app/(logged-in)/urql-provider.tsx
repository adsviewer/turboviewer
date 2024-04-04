'use client';

import { type JSX, useMemo } from 'react';
import { cacheExchange, createClient, fetchExchange, ssrExchange, UrqlProvider } from '@urql/next';
import { env } from '@/config';
import { makeAuthExchange } from '@/lib/urql/urql-auth';

export function AvUrqProvider({
  children,
  token,
}: {
  children: React.ReactNode;
  token: string | undefined;
}): JSX.Element {
  const urql = useMemo(() => {
    const ssr = ssrExchange({
      isClient: typeof window !== 'undefined',
    });
    const client = createClient({
      url: env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
      exchanges: [cacheExchange, makeAuthExchange(token), ssr, fetchExchange],
      suspense: true,
      fetchOptions: { cache: 'no-cache' },
    });

    return { client, ssr };
  }, [token]);

  return (
    <UrqlProvider client={urql.client} ssr={urql.ssr}>
      {children}
    </UrqlProvider>
  );
}
