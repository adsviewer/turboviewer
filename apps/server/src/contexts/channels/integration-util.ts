import type { Integration, IntegrationTypeEnum } from '@repo/database';
import { IntegrationStatus, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { env } from '../../config';
import { decryptAesGcm } from '../../utils/aes-util';

export const authEndpoint = '/channel/auth';

export const revokeIntegration = async (externalId: string, type: IntegrationTypeEnum): Promise<void> => {
  await prisma.integration.update({
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
};

export const getConnectedIntegrationByOrg = async (
  organizationId: string,
  type: IntegrationTypeEnum,
): Promise<Integration | null> => {
  return await prisma.integration
    .findUnique({
      where: {
        organizationId_type: {
          organizationId,
          type,
        },
        status: IntegrationStatus.CONNECTED,
      },
    })
    .then(decryptTokens);
};

export const getAllConnectedIntegrations = async (): Promise<Integration[]> => {
  return await prisma.integration
    .findMany({
      where: {
        status: IntegrationStatus.CONNECTED,
      },
    })
    .then((integrations) => integrations.map(decryptTokens).flatMap((integration) => integration ?? []));
};

export const decryptTokens = (integration: Integration | null): null | Integration => {
  if (integration) {
    const accessToken = decryptAesGcm(integration.accessToken, env.CHANNEL_SECRET);
    if (typeof accessToken !== 'string') {
      logger.warn(`Failed to decrypt access token for integration ${integration.id}`);
      return null;
    }
    integration.accessToken = accessToken;
    if (integration.refreshToken) {
      const refreshToken = decryptAesGcm(integration.refreshToken, env.CHANNEL_SECRET);
      if (typeof refreshToken !== 'string') return null;
      integration.refreshToken = refreshToken;
    }
  }
  return integration;
};
