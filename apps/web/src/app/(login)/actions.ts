'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { type FormState } from '@/components/common/form';
import { SignInSchema, SignUpSchema } from '@/util/schemas/login-schemas';
import { handleUrqlRequest } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/config';

export const signUp = async (prevState: FormState, data: FormData): Promise<FormState> => {
  const formData = Object.fromEntries(data);
  const parsed = SignUpSchema.safeParse(formData);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string -- always a string
      fields[key] = formData[key].toString();
    }
    return {
      message: 'Invalid form data',
      fields,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const result = await handleUrqlRequest(urqlClientSdk().signup(parsed.data));
  if (!result.success) {
    return { message: result.error };
  }
  cookies().set(TOKEN_KEY, result.data.signup.token);
  cookies().set(REFRESH_TOKEN_KEY, result.data.signup.refreshToken);
  revalidatePath('/profile');
  redirect('/profile');
};

export const signIn = async (prevState: FormState, data: FormData): Promise<FormState> => {
  const formData = Object.fromEntries(data);
  const parsed = SignInSchema.safeParse(formData);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string -- always a string
      fields[key] = formData[key].toString();
    }
    return {
      message: 'Invalid form data',
      fields,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const result = await handleUrqlRequest(urqlClientSdk().login(parsed.data));
  if (!result.success) {
    return { message: result.error };
  }
  cookies().set(TOKEN_KEY, result.data.login.token);
  cookies().set(REFRESH_TOKEN_KEY, result.data.login.refreshToken);
  revalidatePath('/profile');
  redirect('/profile');
};
