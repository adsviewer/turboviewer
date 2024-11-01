'use server';

import { type ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';
import { type MeQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export const setCookie = async (name: string, value: string): Promise<ResponseCookies> =>
  (await cookies()).set(name, value);

export const getUserDetails = async (): Promise<MeQuery['me']> => (await (await urqlClientSdk()).me()).me;
