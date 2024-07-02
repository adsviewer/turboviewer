import type { AdAccount, Integration, IntegrationTypeEnum } from '@repo/database';
import { IntegrationStatus, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError, isAError } from '@repo/utils';
import { env } from './config';
import { decryptAesGcm } from './aes-util';

export const authEndpoint = '/channel/auth';

export type AdAccountEssential = Pick<AdAccount, 'id' | 'externalId' | 'currency'>;

export const revokeIntegration = async (externalId: string, type: IntegrationTypeEnum): Promise<void> => {
  const { adAccounts } = await prisma.integration.update({
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
  await prisma.adAccount.deleteMany({
    where: {
      id: {
        in: adAccounts.map((adAccount) => adAccount.id),
      },
    },
  });
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
      await revokeIntegrationById(encryptedIntegration.id, false);
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

export const revokeIntegrationById = async (integrationId: string, notify: boolean): Promise<Integration> => {
  if (notify) {
    // TODO: notify the organization that the integration has been revoked
  }
  return await prisma.integration.update({
    where: { id: integrationId },
    data: { status: IntegrationStatus.REVOKED },
  });
};
