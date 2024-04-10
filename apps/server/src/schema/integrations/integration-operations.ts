import { type Integration, IntegrationTypeEnum, prisma } from '@repo/database';
import { builder } from '../builder';
import { getChannel, saveOrgState } from '../../contexts/channels/channel-helper';
import { FireAndForget } from '../../fire-and-forget';
import {
  IntegrationListItemDto,
  IntegrationStatus,
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
          ? getChannel(channel).generateAuthUrl().url
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

      const { url, state } = getChannel(type).generateAuthUrl();
      fireAndForget.add(() => saveOrgState(state, ctx.organizationId));
      return url;
    },
  }),
}));

const integrationStatus = (type: IntegrationTypeEnum, integrations: Integration[]): IntegrationStatus => {
  const SUPPORTED_INTEGRATIONS: IntegrationTypeEnum[] = [];
  if (!SUPPORTED_INTEGRATIONS.includes(type)) return IntegrationStatus.ComingSoon;

  const integration = integrations.find((i) => i.type === type);
  if (!integration) return IntegrationStatus.NotConnected;
  if (integration.refreshTokenExpiresAt && integration.refreshTokenExpiresAt < new Date())
    return IntegrationStatus.Expired;
  return IntegrationStatus.Connected;
};
