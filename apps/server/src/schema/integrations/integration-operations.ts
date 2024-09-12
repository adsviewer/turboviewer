import { type Integration, IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError, FireAndForget } from '@repo/utils';
import { getChannel, getIntegrationAuthUrl } from '@repo/channel';
import { getRootOrganizationId, getTier } from '@repo/organization';
import { MetaError, revokeIntegration } from '@repo/channel-utils';
import { GraphQLError } from 'graphql/index';
import { maxUsersPerTier } from '@repo/mappings';
import { builder } from '../builder';
import { type ChannelInitialProgressPayload, pubSub } from '../pubsub';
import {
  ChannelInitialProgressPayloadDto,
  getIntegrationStatus,
  IntegrationDto,
  IntegrationListItemDto,
  IntegrationStatusEnum,
  IntegrationTypeDto,
  ShouldConnectIntegrationStatuses,
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
      const maxIntegrations = maxUsersPerTier[tierStatus].maxIntegrations ?? Infinity;

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
}));

const integrationStatus = (type: IntegrationTypeEnum, integrations: Integration[]): IntegrationStatusEnum => {
  const SUPPORTED_INTEGRATIONS: IntegrationTypeEnum[] = [
    IntegrationTypeEnum.META,
    IntegrationTypeEnum.TIKTOK,
    IntegrationTypeEnum.LINKEDIN,
  ];
  if (!SUPPORTED_INTEGRATIONS.includes(type)) return IntegrationStatusEnum.ComingSoon;

  const integration = integrations.find((i) => i.type === type);
  return getIntegrationStatus(integration);
};
