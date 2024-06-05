'use server';

import { type ResponseCookies, type RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';

export async function setCookie(name: string, value: string): Promise<ResponseCookies> {
  return Promise.resolve(cookies().set(name, value));
}

export async function getCookie(name: string): Promise<RequestCookie | undefined> {
  return Promise.resolve(cookies().get(name));
}
