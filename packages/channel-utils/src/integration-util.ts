import { createHmac } from 'node:crypto';
import type { Integration, IntegrationTypeEnum } from '@repo/database';
import { IntegrationStatus, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError, isAError } from '@repo/utils';
import { z } from 'zod';
import { env } from './config';
import { decryptAesGcm, encryptAesGcm } from './aes-util';
import { type AdAccountIntegration } from './insights-utils';
import type { TokensResponse } from './channel-interface';

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

export const getConnectedIntegrationsById = async (integrationIds: string[]): Promise<Integration[]> => {
  return await prisma.integration
    .findMany({
      where: {
        id: { in: integrationIds },
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

export const getConnectedIntegrationsByAccountId = async (adAccountId: string): Promise<Integration[]> => {
  const encryptedIntegrations = await prisma.integration.findMany({
    where: {
      status: IntegrationStatus.CONNECTED,
      adAccounts: { some: { id: adAccountId } },
    },
  });

  return encryptedIntegrations.map((i) => decryptTokens(i)).flatMap((i) => (!isAError(i) && i !== null ? [i] : []));
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

export const updateIntegrationTokens = async (
  integration: Integration,
  tokens: TokensResponse,
): Promise<Integration> => {
  const encryptedAccessToken = encryptAesGcm(tokens.accessToken, env.CHANNEL_SECRET);
  if (!encryptedAccessToken) {
    throw new Error('Failed to encrypt access token');
  }
  const encryptedRefreshToken = tokens.refreshToken
    ? encryptAesGcm(tokens.refreshToken, env.CHANNEL_SECRET)
    : undefined;

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    },
  });
  integration.accessToken = tokens.accessToken;
  integration.accessTokenExpiresAt = tokens.accessTokenExpiresAt;
  integration.refreshToken = tokens.refreshToken ?? null;
  integration.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt ?? null;

  return integration;
};

export const parseRequest = (signedRequest: string, secret: string): string | AError => {
  const [encodedSig, payload] = signedRequest.split('.');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
  const data = JSON.parse(Buffer.from(payload, 'base64').toString());
  const signOutTokenSchema = z.object({
    user_id: z.string(),
    algorithm: z.literal('HMAC-SHA256'),
    issued_at: z.number(),
  });
  const parsed = signOutTokenSchema.safeParse(data);
  if (!parsed.success) {
    return new AError('Failed to parse sign out token');
  }
  if (parsed.data.algorithm.toUpperCase() !== 'HMAC-SHA256')
    return new AError('Failed to verify sign out token, wrong algorithm');

  const hmac = createHmac('sha256', secret);
  const encodedPayload = hmac
    .update(payload)
    .digest('base64')
    .replace(/\//g, '_')
    .replace(/\+/g, '-')
    .replace(/={1,2}$/, '');

  if (encodedSig !== encodedPayload) return new AError('Failed to verify sign out token');

  return parsed.data.user_id;
};
