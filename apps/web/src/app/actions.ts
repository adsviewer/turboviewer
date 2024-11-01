'use server';

import { type ResponseCookies, type RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';

export const setCookie = async (name: string, value: string): Promise<ResponseCookies> =>
  (await cookies()).set(name, value);

export const getCookie = async (name: string): Promise<RequestCookie | undefined> => (await cookies()).get(name);
