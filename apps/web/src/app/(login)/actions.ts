'use server';

import { logger } from '@repo/logger';
import { type FormState } from '@/components/common/form';
import { SignUpSchema } from '@/util/schemas/login-schemas';

export async function onSubmitAction(prevState: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = SignUpSchema.safeParse(formData);

  logger.info('Parsed %o', parsed);
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

  if (parsed.data.email.includes('a')) {
    return {
      message: 'Invalid email',
      fields: parsed.data,
    };
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  return { message: 'User registered' };
}
