'use server';

import { logger } from '@repo/logger';
import {
  type CreateOrganizationMutation,
  type CreateOrganizationMutationVariables,
  type SwitchOrganizationMutation,
  type SwitchOrganizationMutationVariables,
  type UpdateOrganizationMutation,
  type UpdateOrganizationMutationVariables,
  type DeleteOrganizationMutation,
  type DeleteOrganizationMutationVariables,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';
import { changeJWT } from '@/app/(unauthenticated)/actions';

async function createOrganization(
  values: CreateOrganizationMutationVariables,
): Promise<UrqlResult<CreateOrganizationMutation, string>> {
  return await handleUrqlRequest(urqlClientSdk().createOrganization(values));
}

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

export async function deleteOrganization(
  values: DeleteOrganizationMutationVariables,
): Promise<UrqlResult<DeleteOrganizationMutation, string>> {
  return await handleUrqlRequest(urqlClientSdk().deleteOrganization(values));
}

export async function createAndSwitchOrganization(values: CreateOrganizationMutationVariables): Promise<boolean> {
  try {
    const res = await createOrganization(values);

    if (!res.success) {
      logger.error(res.error);
      return false;
    }

    const switchRes = await switchOrganization({ organizationId: res.data.createOrganization.id });

    if (!switchRes.success) {
      logger.error(switchRes.error);
      return false;
    }

    await changeJWT(switchRes.data.switchOrganization.token, switchRes.data.switchOrganization.refreshToken);

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
}
