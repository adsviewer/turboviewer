'use server';

import {
  type MeQuery,
  type UpdateOrganizationMutation,
  type UpdateOrganizationMutationVariables,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';

export async function getUserDetails(): Promise<MeQuery['me']> {
  return (await urqlClientSdk().me()).me;
}

export async function updateOrganization(
  values: UpdateOrganizationMutationVariables,
): Promise<UrqlResult<UpdateOrganizationMutation, string>> {
  return await handleUrqlRequest(urqlClientSdk().updateOrganization(values));
}
