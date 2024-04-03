import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/config';

export function GET(): never {
  cookies().delete(TOKEN_KEY);
  cookies().delete(REFRESH_TOKEN_KEY);
  return redirect('/sign-in');
}
