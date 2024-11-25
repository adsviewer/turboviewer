import { type Integration, IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError, FireAndForget } from '@repo/utils';
import { getChannel, getIntegrationAuthUrl } from '@repo/channel';
import { getRootOrganizationId, getTier } from '@repo/backend-shared';
import { MetaError, revokeIntegration } from '@repo/channel-utils';
import { GraphQLError } from 'graphql/index';
import { tierConstraints } from '@repo/mappings';
import { type ChannelInitialProgressPayload, pubSub } from '@repo/pubsub';
import { type IntegrationStatsUpdateEvent, type NewIntegrationEvent } from '@repo/shared-types';
import { builder } from '../builder';
import {
  ChannelInitialProgressPayloadDto,
  getIntegrationStatus,
  IntegrationDto,
  IntegrationListItemDto,
  IntegrationStatsUpdateEventDto,
  IntegrationStatusEnum,
  IntegrationTypeDto,
  NewIntegrationEventDto,
  ShouldConnectIntegrationStatuses,
  AdAccountIntegrationDto,
} from './integration-types';

const fireAndForget = new FireAndForget();

builder.queryFields((t) => ({
  integrations: t.withAuth({ isInOrg: true }).prismaField({
    type: [IntegrationDto],
    nullable: false,
    args: {
      type: t.arg({ type: IntegrationTypeDto, required: false }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const rootOrganization = await getRootOrganizationId(ctx.organizationId);
      return await prisma.integration.findMany({
        ...query,
        where: {
          organizationId: rootOrganization,
          type: args.type ?? undefined,
        },
      });
    },
  }),
  settingsChannels: t.withAuth({ isInOrg: true }).field({
    type: [IntegrationListItemDto],
    nullable: false,
    resolve: async (_root, _args, ctx, _info) => {
      const rootOrgId = await getRootOrganizationId(ctx.organizationId);
      const integrations = await prisma.integration.findMany({
        where: {
          organizationId: rootOrgId,
        },
      });
      const tierStatus = await getTier(ctx.organizationId);
      const maxIntegrations = tierConstraints[tierStatus].maxIntegrations;

      const currentIntegrations = Object.values(IntegrationTypeEnum).reduce((acc, ch) => {
        const status = integrationStatus(ch, integrations);
        return status === IntegrationStatusEnum.Connected ? acc + 1 : acc;
      }, 0);

      const tierAllowIntegration = currentIntegrations < maxIntegrations;

      return Object.values(IntegrationTypeEnum).map((channel) => {
        const status = integrationStatus(channel, integrations);
        const authUrl =
          ShouldConnectIntegrationStatuses.includes(status) && tierAllowIntegration
            ? getIntegrationAuthUrl(channel, ctx.organizationId, ctx.currentUserId)
            : null;

        authUrl && logger.info(`Integration ${channel} authUrl: ${authUrl}`);
        return {
          type: channel,
          status,
          authUrl,
          tierAllowIntegration,
        };
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  updateIntegrationAdAccounts: t.withAuth({ isRootOrg: true }).field({
    type: [AdAccountIntegrationDto],
    nullable: false,
    args: {
      integrationId: t.arg.string({ required: true }),
      adAccountIds: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      return await Promise.all(
        args.adAccountIds.map((adAccountId) =>
          prisma.adAccountIntegration.create({
            data: {
              integrationId: args.integrationId,
              adAccountId,
              enabled: true,
            },
          }),
        ),
      );
    },
  }),

  deAuthIntegration: t.withAuth({ $all: { isRootOrg: true, isInOrg: true } }).field({
    type: 'String',
    nullable: false,
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
        logger.error(externalId);
        throw new GraphQLError(externalId.message);
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
    nullable: false,
    resolve: (root: ChannelInitialProgressPayload, _args, _ctx, _info) => root,
    subscribe: (_root, _args, ctx) => pubSub.subscribe('user:channel:initial-progress', ctx.currentUserId),
  }),
  newIntegration: t.withAuth({ isInOrg: true }).field({
    type: NewIntegrationEventDto,
    nullable: false,
    resolve: (root: NewIntegrationEvent, _args, _ctx, _info) => {
      return root;
    },
    subscribe: (_root, _args, ctx) => {
      return pubSub.subscribe('organization:integration:new-integration', ctx.organizationId);
    },
  }),
  integrationUpdateStatus: t.withAuth({ isInOrg: true }).field({
    type: IntegrationStatsUpdateEventDto,
    nullable: false,
    resolve: (root: IntegrationStatsUpdateEvent, _args, _ctx, _info) => root,
    subscribe: (_root, _args, ctx) => pubSub.subscribe('organization:integration:status-update', ctx.organizationId),
  }),
}));

const integrationStatus = (type: IntegrationTypeEnum, integrations: Integration[]): IntegrationStatusEnum => {
  const SUPPORTED_INTEGRATIONS: IntegrationTypeEnum[] = [
    IntegrationTypeEnum.META,
    IntegrationTypeEnum.TIKTOK,
    IntegrationTypeEnum.LINKEDIN,
    IntegrationTypeEnum.GOOGLE,
  ];
  if (!SUPPORTED_INTEGRATIONS.includes(type)) return IntegrationStatusEnum.ComingSoon;

  const integration = integrations.find((i) => i.type === type);
  return getIntegrationStatus(integration);
};
