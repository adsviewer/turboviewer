import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { redis } from '@repo/redis';
import { isAError } from '@repo/utils';
import { env, isMode } from '../../config';
import { FireAndForget } from '../../fire-and-forget';
import { encryptAesGcm } from '../../utils/aes-util';
import { facebook } from './fb/fb';
import { type ChannelInterface, type TokensResponse } from './channel-interface';

export const getChannel = (channel: IntegrationTypeEnum): ChannelInterface => {
  switch (channel) {
    case IntegrationTypeEnum.FACEBOOK:
      return facebook;
    default:
      throw new Error('Channel not found');
  }
};

const fireAndForget = new FireAndForget();

export const authRedirectCallback = (req: ExpressRequest, res: ExpressResponse): void => {
  const { code, state: stateArg, error_description: errorDescription } = req.query;

  if (errorDescription === 'user_denied') {
    res.redirect(`${env.PUBLIC_URL}/settings/integrations`);
    return;
  }

  if (typeof code !== 'string' || typeof stateArg !== 'string') {
    res.redirect(`${env.PUBLIC_URL}/settings/integrations?error=invalid_code`);
    return;
  }

  const [mode, integration, state] = stateArg.split('_');

  // mode should only be A-z0-9-_
  if (!/^[A-z0-9-_]+$/.test(state)) {
    res.redirect('/settings/integrations?error=invalid_state');
    return;
  }

  if (!isMode(mode)) {
    res.redirect('/settings/integrations?error=invalid_mode');
    return;
  }

  // integration should only be one of the IntegrationTypeEnum values
  if (!isIntegrationTypeEnum(integration)) {
    res.redirect('/settings/integrations?error=invalid_integration');
    return;
  }

  const path = `/settings/integrations/${integration}/callback?${new URLSearchParams({
    code,
    state: stateArg,
  }).toString()}`;

  const invalidStateUrl = `${env.PUBLIC_URL}/settings/integrations?error=invalid_state`;
  const onRejected = (e: unknown) => {
    logger.error(e);
    res.redirect(invalidStateUrl);
  };

  getOrgFromState(stateArg)
    .then((organizationId) => {
      if (!organizationId) {
        res.redirect(invalidStateUrl);
        return;
      }
      const channel = getChannel(integration);
      channel
        .exchangeCodeForTokens(code)
        .then((tokens) => {
          if (isAError(tokens)) {
            res.redirect(invalidStateUrl);
            return;
          }
          fireAndForget.add(() => saveTokens(tokens, organizationId, integration));
          res.redirect(env.PUBLIC_URL + path);
        })
        .catch(onRejected);
    })
    .catch(onRejected);
};

const integrationStateKey = (state: string) => `integration-state:${state}`;
export const saveOrgState = async (state: string, organizationId: string): Promise<void> => {
  await redis.set(integrationStateKey(state), organizationId, { EX: 12 * 60 * 60 });
};
const getOrgFromState = async (state: string): Promise<string | null> => {
  return await redis.get(integrationStateKey(state));
};

export const isIntegrationTypeEnum = (val: string): val is IntegrationTypeEnum =>
  Object.values(IntegrationTypeEnum).includes(val as IntegrationTypeEnum);

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

  const integrationData = {
    type,
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
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
