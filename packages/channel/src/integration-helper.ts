import { randomUUID } from 'node:crypto';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import {
  type Integration,
  IntegrationStatus,
  type IntegrationTypeEnum,
  MilestoneEnum,
  Prisma,
  prisma,
} from '@repo/database';
import { getTier, removeUserMilestone } from '@repo/backend-shared';
import { logger } from '@repo/logger';
import { redisGet, redisSet } from '@repo/redis';
import { AError, FireAndForget, isAError } from '@repo/utils';
import type QueryString from 'qs';
import { z } from 'zod';
import { encryptAesGcm, type TokensResponse } from '@repo/channel-utils';
import { isMode, MODE } from '@repo/mode';
import { tierConstraints } from '@repo/mappings';
import { pubSub } from '@repo/pubsub';
import { getChannel, isIntegrationTypeEnum } from './channel-helper';
import { env } from './config';
import { invokeChannelIngress } from './data-refresh';
import IntegrationUncheckedCreateInput = Prisma.IntegrationUncheckedCreateInput;
import PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;

const fireAndForget = new FireAndForget();

export const authCallback = (req: ExpressRequest, res: ExpressResponse): void => {
  const {
    code,
    state: stateArg,
    error_description: errorDescription,
    error: channelError,
    scopes: _scopes,
  } = req.query;

  const error = errorDescription ?? channelError;
  completeIntegration(code, stateArg, error)
    .then((integrationType) => {
      if (isAError(integrationType)) {
        logger.warn('Failed to complete integration %s:', integrationType.message);
        res.redirect(`${env.PUBLIC_URL}/integrations?error=${integrationType.message}`);
      } else {
        res.redirect(`${env.PUBLIC_URL}/integrations?type=${integrationType}&status=success`);
      }
    })
    .catch((_e: unknown) => {
      res.redirect(`${env.PUBLIC_URL}/integrations?error=unknown_error`);
    });
};

export const getIntegrationAuthUrl = (type: IntegrationTypeEnum, organizationId: string, userId: string): string => {
  const state = `${MODE}_${type}_${randomUUID()}`;
  const { url } = getChannel(type).generateAuthUrl(state);
  fireAndForget.add(() => saveOrgState(state, organizationId, userId));
  return url;
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

  const [mode, integrationType, state] = stateArg.split('_');

  // mode should only be uuid
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(state)) {
    return new AError('invalid_state');
  }

  if (!isMode(mode)) {
    return new AError('invalid_mode');
  }

  // integration should only be one of the IntegrationTypeEnum values
  if (!isIntegrationTypeEnum(integrationType)) {
    return new AError('invalid_integration');
  }

  const redisResp = await getOrgFromState(stateArg);
  if (!redisResp) {
    return new AError('invalid_organization');
  }

  const { organizationId } = redisResp;
  const channel = getChannel(integrationType);
  const tokens = await channel.exchangeCodeForTokens(code);
  if (isAError(tokens)) {
    return tokens;
  }

  const tierStatus = await getTier(organizationId);
  const maxIntegrations = tierConstraints[tierStatus].maxIntegrations;

  const currentIntegrations = await prisma.integration.count({
    where: {
      organizationId,
      status: IntegrationStatus.CONNECTED,
    },
  });

  if (currentIntegrations > maxIntegrations) {
    return new AError('Max integration limit reached for the current tier');
  }
  const decryptedIntegration = await saveTokens(tokens, organizationId, integrationType).catch((e: unknown) => {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
      const metaSchema = z.object({ modelName: z.string(), target: z.array(z.string()) });
      const parsed = metaSchema.safeParse(e.meta);
      if (
        parsed.success &&
        parsed.data.modelName === 'Integration' &&
        parsed.data.target.includes('external_id') &&
        parsed.data.target.includes('type')
      )
        return new AError(
          'There is already an integration for this organization. Please disconnect the existing one first.',
        );
      return new AError('Failed to save tokens to database');
    }
    logger.error(e, 'Failed to save tokens to database');
    return new AError('Failed to save tokens to database');
  });
  if (isAError(decryptedIntegration)) return decryptedIntegration;

  fireAndForget.add(async () => await invokeChannelIngress(false, [decryptedIntegration.id]));

  return integrationType;
};

const integrationStateKey = (state: string): string => `integration-state:${state}`;
export const saveOrgState = async (state: string, organizationId: string, userId: string): Promise<void> => {
  await redisSet(integrationStateKey(state), JSON.stringify({ organizationId, userId }), 12 * 60 * 60);
};
const getOrgFromState = async (state: string): Promise<{ organizationId: string; userId: string } | null> => {
  return await redisGet<{ organizationId: string; userId: string }>(integrationStateKey(state));
};

const saveTokens = async (
  tokens: TokensResponse,
  organizationId: string,
  type: IntegrationTypeEnum,
): Promise<Integration | AError> => {
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
      return externalId;
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

  const [integration] = await Promise.all([
    prisma.integration.upsert({
      create: integrationData,
      update: integrationData,
      where: {
        organizationId_type: {
          organizationId,
          type,
        },
      },
    }),
    removeOnboardingMilestone(organizationId),
  ]);

  // Fire event for new integration to all subscribed entities
  pubSub.publish('organization:integration:new-integration', organizationId, {
    id: organizationId,
    type,
  });

  // TODO: Fire event for new notification to all subscribed entities
  // WE SOMEHOW NEED TO GET ALL ORG USERS HERE, LOOP THROUGH THEM AND CREATE A NOTIFICATION + PUBLISH NOTIFICATION
  // FOR EACH ORG USER!
  // pubSub.publish('user:notification:new-notification', notification.receivingUserId, {
  //   id: notification.id,
  //   receivingUserId: notification.receivingUserId,
  //   type: NotificationTypeEnum.NEW_INTEGRATION,
  //   isRead: false,
  //   createdAt: new Date(),
  // });

  const decryptedIntegration = {
    ...integration,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
  };
  const adAccounts = await getChannel(type).saveAdAccounts(decryptedIntegration);
  if (isAError(adAccounts)) return adAccounts;
  return decryptedIntegration;
};

const removeOnboardingMilestone = async (organizationId: string): Promise<void> => {
  const usersWithOrg = await prisma.user.findMany({ where: { organizations: { some: { organizationId } } } });
  await Promise.all(usersWithOrg.map(async (user) => removeUserMilestone(user.id, MilestoneEnum.Onboarding)));
};
