'use server';

import { type UpdateUserMutationVariables, type UpdateUserMutation } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export async function updateUserDetails(values: UpdateUserMutationVariables): Promise<UpdateUserMutation> {
  return await urqlClientSdk().updateUser(values);
}
