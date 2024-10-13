'use server';

import { logger } from '@repo/logger';
import {
  type RemoveUserFromOrganizationMutation,
  type RemoveUserFromOrganizationMutationVariables,
  type CreateOrganizationMutation,
  type CreateOrganizationMutationVariables,
  type InviteUsersMutation,
  type InviteUsersMutationVariables,
  type SwitchOrganizationMutation,
  type SwitchOrganizationMutationVariables,
  type UpdateOrganizationMutation,
  type UpdateOrganizationMutationVariables,
  type DeleteOrganizationMutation,
  type DeleteOrganizationMutationVariables,
  type IntegrationType,
  type OrganizationAdAccountsQuery,
  type UpdateOrganizationAdAccountsMutationVariables,
  type AvailableOrganizationAdAccountsQuery,
  type UpdateOrganizationAdAccountsMutation,
  type UpdateOrganizationUserMutation,
  type UpdateOrganizationUserMutationVariables,
  type GetOrganizationQuery,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';
import { changeJWT } from '@/app/(unauthenticated)/actions';
import { refreshJWTToken } from '@/app/(authenticated)/actions';

export default async function getOrganization(): Promise<UrqlResult<GetOrganizationQuery>> {
  return await handleUrqlRequest(urqlClientSdk().getOrganization());
}

const createOrganization = async (
  values: CreateOrganizationMutationVariables,
): Promise<UrqlResult<CreateOrganizationMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().createOrganization(values));

export const updateOrganizationUser = async (
  values: UpdateOrganizationUserMutationVariables,
): Promise<UrqlResult<UpdateOrganizationUserMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().updateOrganizationUser(values));

export const updateOrganization = async (
  values: UpdateOrganizationMutationVariables,
): Promise<UrqlResult<UpdateOrganizationMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().updateOrganization(values));

const switchOrganization = async (
  values: SwitchOrganizationMutationVariables,
): Promise<UrqlResult<SwitchOrganizationMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().switchOrganization(values));

const deleteOrganization = async (
  values: DeleteOrganizationMutationVariables,
): Promise<UrqlResult<DeleteOrganizationMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().deleteOrganization(values));

export async function createAndSwitchOrganization(values: CreateOrganizationMutationVariables): Promise<UrqlResult> {
  try {
    const res = await createOrganization(values);

    if (!res.success) {
      return {
        success: false,
        error: res.error,
      };
    }

    const switchRes = await switchOrganization({ organizationId: res.data.createOrganization.id });

    if (!switchRes.success) {
      return switchRes;
    }

    await changeJWT(switchRes.data.switchOrganization.token, switchRes.data.switchOrganization.refreshToken);
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

export async function deleteOrganizationAndRefreshJWT(
  values: DeleteOrganizationMutationVariables,
): Promise<UrqlResult> {
  try {
    const res = await deleteOrganization(values);

    if (!res.success) {
      return res;
    }

    const refreshRes = await refreshJWTToken();

    await changeJWT(refreshRes.refreshToken);

    return res;
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

export async function switchOrganizationAndChangeJWT(values: SwitchOrganizationMutationVariables): Promise<{
  success: boolean;
  error?: unknown;
}> {
  try {
    const res = await switchOrganization(values);

    if (!res.success) {
      logger.error(res.error);
      return {
        success: false,
        error: res.error,
      };
    }

    await changeJWT(res.data.switchOrganization.token, res.data.switchOrganization.refreshToken);

    return {
      success: true,
    };
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      error,
    };
  }
}

export const getOrganizationAdAccounts = async (
  channel: IntegrationType,
): Promise<UrqlResult<OrganizationAdAccountsQuery>> =>
  await handleUrqlRequest(urqlClientSdk().organizationAdAccounts({ channel }));

export const getAvailableOrganizationAdAccounts = async (
  channel: IntegrationType,
): Promise<UrqlResult<AvailableOrganizationAdAccountsQuery>> =>
  await handleUrqlRequest(urqlClientSdk().availableOrganizationAdAccounts({ channel }));

export const updateOrganizationAdAccounts = async (
  values: UpdateOrganizationAdAccountsMutationVariables,
): Promise<UrqlResult<UpdateOrganizationAdAccountsMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().updateOrganizationAdAccounts(values));

type InviteUsersMutationError = Extract<
  InviteUsersMutation['inviteUsers'],
  { __typename: 'InviteUsersErrors' }
>['error'];

export const inviteUsers = async (
  values: InviteUsersMutationVariables,
): Promise<UrqlResult<InviteUsersMutation, InviteUsersMutationError | string>> =>
  await handleUrqlRequest<InviteUsersMutation, InviteUsersMutationError>(urqlClientSdk().inviteUsers(values));

export const removeUserFromOrganization = async (
  values: RemoveUserFromOrganizationMutationVariables,
): Promise<UrqlResult<RemoveUserFromOrganizationMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().removeUserFromOrganization(values));
