import { type Client, createClient } from '@urql/core';
import { cookies, headers } from 'next/headers';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { createUrqlRequester } from '@/util/create-urql-requester';
import { getSdk } from '@/graphql/generated/schema-server';
import { env } from '@/env.mjs';
import { makeUrqlClientOptions } from '@/lib/urql/urql-options';

const makeClient = async (refresh?: boolean): Promise<Client> => {
  const cookieStore = await cookies();
  const token = refresh ? cookieStore.get(REFRESH_TOKEN_KEY)?.value : cookieStore.get(TOKEN_KEY)?.value;
  const acceptedLanguage = (await headers()).get('accept-language');
  return createClient(makeUrqlClientOptions(acceptedLanguage, token, env.GRAPHQL_ENDPOINT));
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complicated to type
export const urqlClientSdk = async () => getSdk(createUrqlRequester(await makeClient()));
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complicated to type
export const urqlClientSdkRefresh = async () => getSdk(createUrqlRequester(await makeClient(true)));
