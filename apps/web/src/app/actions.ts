'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@repo/logger';
import { SignUpSchema } from '../util/schemas/login-schemas';
import { urqlClientSdk } from '../lib/urql-client';
import { handleUrqlRequest } from '../util/handle-urql-request';

export async function createUser(
  prevState: {
    message: string;
  },
  formData: FormData,
): Promise<{ message: string }> {
  const parse = SignUpSchema.safeParse({
    email: formData.get('email'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    password: formData.get('password'),
  });

  if (!parse.success) {
    return { message: 'Failed to create user' };
  }
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  const data = parse.data;

  try {
    logger.info('Creating user');
    const result = await handleUrqlRequest(urqlClientSdk.signup(data));
    if (!result.success) {
      return { message: result.error };
    }
    revalidatePath('/');
    return { message: `Added user` };
  } catch (e) {
    return { message: 'Failed to create user' };
  }
}
