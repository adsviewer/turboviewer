import { type Integration, IntegrationStatus, IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError, FireAndForget } from '@repo/utils';
import { getChannel, getIntegrationAuthUrl } from '@repo/channel';
import { MetaError, revokeIntegration } from '@repo/channel-utils';
import { builder } from '../builder';
import { type ChannelInitialProgressPayload, pubSub } from '../pubsub';
import {
  ChannelInitialProgressPayloadDto,
  IntegrationDto,
  IntegrationListItemDto,
  IntegrationStatusEnum,
  IntegrationTypeDto,
  ShouldConnectIntegrationStatuses,
} from './integration-types';

const fireAndForget = new FireAndForget();

builder.queryFields((t) => ({
  integrations: t.withAuth({ authenticated: true }).prismaField({
    type: [IntegrationDto],
    args: {
      type: t.arg({ type: IntegrationTypeDto, required: false }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return await prisma.integration.findMany({
        ...query,
        where: {
          organizationId: ctx.organizationId,
          type: args.type ?? undefined,
        },
      });
    },
  }),
  settingsChannels: t.withAuth({ authenticated: true }).field({
    type: [IntegrationListItemDto],
    resolve: async (_root, _args, ctx, _info) => {
      const integrations = await prisma.integration.findMany({
        where: {
          organizationId: ctx.organizationId,
        },
      });

      return Object.values(IntegrationTypeEnum).map((channel) => {
        const status = integrationStatus(channel, integrations);
        const authUrl = ShouldConnectIntegrationStatuses.includes(status)
          ? getIntegrationAuthUrl(channel, ctx.organizationId, ctx.currentUserId)
          : undefined;
        authUrl && logger.info(`Integration ${channel} authUrl: ${authUrl}`);
        return {
          type: channel,
          status,
          authUrl,
        };
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  deAuthIntegration: t.withAuth({ authenticated: true }).field({
    type: 'String',
    errors: { types: [MetaError, AError] },
    args: {
      type: t.arg({
        type: IntegrationTypeDto,
        required: true,
      }),
    },
    resolve: async (_root, args, ctx, _info) => {
      logger.info(`De-authorizing integration ${args.type} for organization ${ctx.organizationId}`);
      const externalId = await getChannel(args.type).deAuthorize(ctx.organizationId);
      if (externalId instanceof AError) {
        throw externalId;
      }
      fireAndForget.add(() => revokeIntegration(externalId, args.type));
      const authUrl = getIntegrationAuthUrl(args.type, ctx.organizationId, ctx.currentUserId);
      logger.info(`De-authorized integration ${args.type} for organization ${ctx.organizationId}`);
      return authUrl;
    },
  }),
}));

builder.subscriptionFields((t) => ({
  channelInitialSetupProgress: t.withAuth({ authenticated: true }).field({
    type: ChannelInitialProgressPayloadDto,
    resolve: (root: ChannelInitialProgressPayload, _args, _ctx, _info) => root,
    subscribe: (_root, _args, ctx) => pubSub.subscribe('user:channel:initial-progress', ctx.currentUserId),
  }),
}));

const integrationStatus = (type: IntegrationTypeEnum, integrations: Integration[]): IntegrationStatusEnum => {
  const SUPPORTED_INTEGRATIONS: IntegrationTypeEnum[] = [IntegrationTypeEnum.META, IntegrationTypeEnum.LINKEDIN];
  if (!SUPPORTED_INTEGRATIONS.includes(type)) return IntegrationStatusEnum.ComingSoon;

  const integration = integrations.find((i) => i.type === type);
  if (!integration) return IntegrationStatusEnum.NotConnected;
  if (integration.status === IntegrationStatus.REVOKED) return IntegrationStatusEnum.Revoked;
  if (
    (integration.refreshTokenExpiresAt && integration.refreshTokenExpiresAt < new Date()) ??
    (!integration.refreshTokenExpiresAt && integration.accessTokenExpiresAt < new Date())
  )
    return IntegrationStatusEnum.Expired;
  return IntegrationStatusEnum.Connected;
};
