import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { IntegrationStatus, type IntegrationTypeEnum, Prisma, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { redis } from '@repo/redis';
import { AError, isAError } from '@repo/utils';
import type QueryString from 'qs';
import { env, isMode } from '../../config';
import { FireAndForget } from '../../fire-and-forget';
import { encryptAesGcm } from '../../utils/aes-util';
import { type TokensResponse } from './channel-interface';
import { getChannel, isIntegrationTypeEnum } from './channel-helper';
import IntegrationUncheckedCreateInput = Prisma.IntegrationUncheckedCreateInput;

const fireAndForget = new FireAndForget();

export const authCallback = (req: ExpressRequest, res: ExpressResponse): void => {
  const { code, state: stateArg, error_description: errorDescription } = req.query;

  completeIntegration(code, stateArg, errorDescription)
    .then((integrationType) => {
      if (isAError(integrationType)) {
        res.redirect(`${env.PUBLIC_URL}/settings/integrations?error=${integrationType.message}`);
      } else {
        res.redirect(`${env.PUBLIC_URL}/settings/integrations/${integrationType}/success`);
      }
    })
    .catch((_e: unknown) => {
      res.redirect(`${env.PUBLIC_URL}/settings/integrations?error=uknown_error`);
    });
};

const completeIntegration = async (
  code: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined,
  stateArg: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined,
  errorDescription: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined,
): Promise<AError | IntegrationTypeEnum> => {
  if (typeof errorDescription === 'string') {
    return new AError(errorDescription);
  }

  if (typeof code !== 'string' || typeof stateArg !== 'string') {
    return new AError('invalid_code');
  }

  const [mode, integration, state] = stateArg.split('_');

  // mode should only be A-z0-9-_
  if (!/^[A-z0-9-_]+$/.test(state)) {
    return new AError('invalid_state');
  }

  if (!isMode(mode)) {
    return new AError('invalid_mode');
  }

  // integration should only be one of the IntegrationTypeEnum values
  if (!isIntegrationTypeEnum(integration)) {
    return new AError('invalid_integration');
  }

  const organizationId = await getOrgFromState(stateArg);
  if (!organizationId) {
    return new AError('invalid_organization');
  }

  const channel = getChannel(integration);
  const tokens = await channel.exchangeCodeForTokens(code);
  if (isAError(tokens)) {
    return tokens;
  }

  fireAndForget.add(() => saveTokens(tokens, organizationId, integration));
  return integration;
};

const integrationStateKey = (state: string) => `integration-state:${state}`;
export const saveOrgState = async (state: string, organizationId: string): Promise<void> => {
  await redis.set(integrationStateKey(state), organizationId, { EX: 12 * 60 * 60 });
};
const getOrgFromState = async (state: string): Promise<string | null> => {
  return await redis.get(integrationStateKey(state));
};

const saveTokens = async (
  tokens: TokensResponse,
  organizationId: string,
  type: IntegrationTypeEnum,
): Promise<string> => {
  logger.info(`Saving tokens for organization ${organizationId}`);

  const encryptedAccessToken = encryptAesGcm(tokens.accessToken, env.CHANNEL_SECRET);
  if (!encryptedAccessToken) {
    throw new Error('Failed to encrypt access token');
  }
  const encryptedRefreshToken = tokens.refreshToken
    ? encryptAesGcm(tokens.refreshToken, env.CHANNEL_SECRET)
    : undefined;

  if (!tokens.externalId) {
    const externalId = await getChannel(type).getUserId(tokens.accessToken);
    if (isAError(externalId)) {
      logger.error(`Failed to get external id for organization: ${organizationId} and channel: ${type}`);
      return 'failed to get external id';
    }
    tokens.externalId = externalId;
  }

  const integrationData: IntegrationUncheckedCreateInput = {
    type,
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    externalId: tokens.externalId,
    status: IntegrationStatus.CONNECTED,
    organizationId,
  };
  const integration = await prisma.integration.upsert({
    create: integrationData,
    update: integrationData,
    where: {
      organizationId_type: {
        organizationId,
        type,
      },
    },
  });
  return integration.id;
};
