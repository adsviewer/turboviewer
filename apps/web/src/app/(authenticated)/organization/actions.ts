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

export async function createOrganization(
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
  void createOrganization(values)
    .then((res) => {
      if (!res.success) {
        return;
      }
      void switchOrganization({ organizationId: res.data.createOrganization.id })
        .then((switchRes) => {
          logger.info('sever data bro');
          if (!switchRes.success) {
            return;
          }
          void changeJWT(switchRes.data.switchOrganization.refreshToken).then(() => {
            return Promise.resolve(true);
          });
        })
        .catch((error: unknown) => {
          logger.error(error);
        });
    })
    .catch((error: unknown) => {
      logger.error(error);
    });

  return Promise.resolve(false);
}
