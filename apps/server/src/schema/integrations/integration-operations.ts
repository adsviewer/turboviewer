import { type Integration, IntegrationStatus, IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError } from '@repo/utils';
import { pipe } from 'graphql-yoga';
import { builder } from '../builder';
import { getIntegrationAuthUrl } from '../../contexts/channels/integration-helper';
import { getChannel } from '../../contexts/channels/channel-helper';
import { FbError } from '../../contexts/channels/fb/fb-channel';
import { revokeIntegration } from '../../contexts/channels/integration-util';
import { FireAndForget } from '../../fire-and-forget';
import { pubSub } from '../pubsub';
import {
  IntegrationListItemDto,
  IntegrationStatusEnum,
  IntegrationTypeDto,
  ShouldConnectIntegrationStatuses,
} from './integration-types';

const fireAndForget = new FireAndForget();

builder.queryFields((t) => ({
  integrations: t.withAuth({ authenticated: true }).field({
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
          ? getIntegrationAuthUrl(channel, ctx.organizationId)
          : undefined;
        return {
          type: channel,
          status,
          authUrl,
        };
      });
    },
  }),
  integrationAuthUrl: t.withAuth({ authenticated: true }).field({
    type: 'String',
    args: {
      type: t.arg({
        type: IntegrationTypeDto,
        required: true,
      }),
    },
    resolve: (_root, args, ctx, _info) => {
      const { type } = args;
      return getIntegrationAuthUrl(type, ctx.organizationId);
    },
  }),
}));

builder.mutationFields((t) => ({
  deAuthIntegration: t.withAuth({ authenticated: true }).field({
    type: 'String',
    errors: { types: [FbError, AError] },
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
      const authUrl = getIntegrationAuthUrl(args.type, ctx.organizationId);
      logger.info(`De-authorized integration ${args.type} for organization ${ctx.organizationId}`);
      return authUrl;
    },
  }),
  createProgress: t.field({
    type: 'String',
    resolve: async (_root, _args, _ctx, _info) => {
      pubSub.publish('user:fb:progress', 0);
      for (let i = 1; i <= 100; i++) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        pubSub.publish('user:fb:progress', i);
      }
      return 'Success';
    },
  }),
}));

builder.subscriptionFields((t) => ({
  channelInitialSetupProgress: t.field({
    type: 'Int',
    resolve: (root: number, _args, _ctx, _info) => root,
    subscribe: (_root, _args, _ctx) => {
      return pipe(pubSub.subscribe('user:fb:progress'));
    },
  }),
}));

const integrationStatus = (type: IntegrationTypeEnum, integrations: Integration[]): IntegrationStatusEnum => {
  const SUPPORTED_INTEGRATIONS: IntegrationTypeEnum[] = [IntegrationTypeEnum.FACEBOOK];
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
