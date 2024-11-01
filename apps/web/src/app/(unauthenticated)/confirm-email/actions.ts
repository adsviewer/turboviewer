'use server';

import { urqlClientSdk } from '@/lib/urql/urql-client';
import { type ResendEmailConfirmationMutation } from '@/graphql/generated/schema-server';

export const resendEmailConfirmation = async (): Promise<ResendEmailConfirmationMutation> => {
  return await (await urqlClientSdk()).resendEmailConfirmation();
};
