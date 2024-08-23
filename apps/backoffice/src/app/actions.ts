'use server';

import { type ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';

export async function setCookie(name: string, value: string): Promise<ResponseCookies> {
  return Promise.resolve(cookies().set(name, value));
}
