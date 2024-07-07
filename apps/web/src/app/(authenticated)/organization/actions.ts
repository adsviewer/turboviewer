'use server';

import {
  type SwitchOrganizationMutation,
  type SwitchOrganizationMutationVariables,
  type UpdateOrganizationMutation,
  type UpdateOrganizationMutationVariables,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';

export async function updateOrganization(
  values: UpdateOrganizationMutationVariables,
): Promise<UrqlResult<UpdateOrganizationMutation, string>> {
  return await handleUrqlRequest(urqlClientSdk().updateOrganization(values));
}

export async function switchOrganization(
  values: SwitchOrganizationMutationVariables,
): Promise<UrqlResult<SwitchOrganizationMutation, string>> {
  return await handleUrqlRequest(urqlClientSdk().switchOrganization(values));
}
