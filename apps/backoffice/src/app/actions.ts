'use server';

import { type ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';
import { type MeQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export async function setCookie(name: string, value: string): Promise<ResponseCookies> {
  return Promise.resolve(cookies().set(name, value));
}

export async function getUserDetails(): Promise<MeQuery['me']> {
  return (await urqlClientSdk().me()).me;
}
