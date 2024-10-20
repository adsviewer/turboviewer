import type { Integration, IntegrationTypeEnum } from '@repo/database';
import { IntegrationStatus, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError, isAError } from '@repo/utils';
import { env } from './config';
import { decryptAesGcm } from './aes-util';
import { type AdAccountIntegration } from './insights-utils';

export const authEndpoint = '/channel/auth';

export const revokeIntegration = async (externalId: string, type: IntegrationTypeEnum): Promise<void> => {
  /*const { adAccounts } = */
  await prisma.integration.update({
    select: { adAccounts: true },
    where: {
      externalId_type: {
        externalId,
        type,
      },
    },
    data: {
      status: IntegrationStatus.REVOKED,
    },
  });
  // TODO: will be fixed as part of https://github.com/adsviewer/turboviewer/issues/351
  // await prisma.adAccount.deleteMany({
  //   where: {
  //     id: {
  //       in: adAccounts.map((adAccount) => adAccount.id),
  //     },
  //   },
  // });
};

export const getConnectedIntegrationByOrg = async (
  organizationId: string,
  type: IntegrationTypeEnum,
): Promise<Integration | null | AError> => {
  const encryptedIntegration = await prisma.integration.findUnique({
    where: {
      organizationId_type: {
        organizationId,
        type,
      },
      status: IntegrationStatus.CONNECTED,
    },
  });

  if (!encryptedIntegration) return null;
  const integration = decryptTokens(encryptedIntegration);

  if (isAError(integration)) {
    if (encryptedIntegration.id) {
      await markErrorIntegrationById(encryptedIntegration.id, false);
    }
    return integration;
  }

  return integration;
};

export const getAllConnectedIntegrations = async (): Promise<Integration[]> => {
  return await prisma.integration
    .findMany({
      where: {
        status: IntegrationStatus.CONNECTED,
      },
    })
    .then((integrations) =>
      integrations.map(decryptTokens).flatMap((integration) => {
        if (!integration) return [];
        if (isAError(integration)) return [];
        return integration;
      }),
    );
};

export const decryptTokens = (integration: Integration | null): null | AError | Integration => {
  if (integration) {
    const accessToken = decryptAesGcm(integration.accessToken, env.CHANNEL_SECRET);
    if (typeof accessToken !== 'string') {
      logger.warn(`Failed to decrypt access token for integration ${integration.id}`);
      return new AError('Failed to decrypt access token');
    }
    integration.accessToken = accessToken;
    if (integration.refreshToken) {
      const refreshToken = decryptAesGcm(integration.refreshToken, env.CHANNEL_SECRET);
      if (typeof refreshToken !== 'string') {
        logger.warn(`Failed to decrypt refresh token for integration ${integration.id}`);
        return new AError('Failed to decrypt refresh token');
      }
      integration.refreshToken = refreshToken;
    }
  }
  return integration;
};

export const markErrorIntegrationById = async (integrationId: string, notify: boolean): Promise<Integration> => {
  if (notify) {
    // TODO: notify the organization that the integration has been revoked
  }
  return await prisma.integration.update({
    where: { id: integrationId },
    data: { status: IntegrationStatus.ERRORED },
  });
};

export const getConnectedIntegrationByAccountId = async (adAccountId: string): Promise<Integration | AError> => {
  const encryptedIntegration = await prisma.integration.findFirstOrThrow({
    where: {
      status: IntegrationStatus.CONNECTED,
      adAccounts: { some: { id: adAccountId } },
    },
  });

  const decryptedIntegration = decryptTokens(encryptedIntegration);
  if (isAError(decryptedIntegration)) return decryptedIntegration;
  if (!decryptedIntegration) return new AError('Failed to decrypt integration');

  return decryptedIntegration;
};

export const getAdAccountWithIntegration = async (adAccountId: string): Promise<AdAccountIntegration | AError> => {
  const adAccount = await prisma.adAccount.findUniqueOrThrow({
    where: { id: adAccountId },
  });
  const decryptedIntegration = await getConnectedIntegrationByAccountId(adAccount.id);
  if (isAError(decryptedIntegration)) return decryptedIntegration;
  return { adAccount, integration: decryptedIntegration };
};

export const getAdAccountsWithIntegration = async (adAccountIds: string[]): Promise<AdAccountIntegration[]> => {
  const adAccounts = await prisma.adAccount.findMany({
    where: { id: { in: adAccountIds } },
  });
  return await Promise.all(
    adAccounts.flatMap(async (adAccount) => {
      const decryptedIntegration = await getConnectedIntegrationByAccountId(adAccount.id);
      if (isAError(decryptedIntegration)) return [];
      return [{ adAccount, integration: decryptedIntegration }];
    }),
  ).then((adAccountsWithIntegrations) => adAccountsWithIntegrations.flat());
};

export const getDecryptedIntegration = async (integrationId: string): Promise<Integration | AError> => {
  const integration = await prisma.integration.findUniqueOrThrow({ where: { id: integrationId } });
  const decryptedIntegration = decryptTokens(integration);
  if (!decryptedIntegration) return new AError('Failed to decrypt integration');
  return decryptedIntegration;
};
