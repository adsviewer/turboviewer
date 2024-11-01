'use server';

import { type UpdateUserMutation, type UpdateUserMutationVariables } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';

export const updateUserDetails = async (
  values: UpdateUserMutationVariables,
): Promise<UrqlResult<UpdateUserMutation, string>> =>
  await handleUrqlRequest((await urqlClientSdk()).updateUser(values));
