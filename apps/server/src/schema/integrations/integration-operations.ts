import { type Integration, IntegrationTypeEnum, prisma, IntegrationStatus } from '@repo/database';
import { builder } from '../builder';
import { saveOrgState } from '../../contexts/channels/integration-helper';
import { FireAndForget } from '../../fire-and-forget';
import { getChannel } from '../../contexts/channels/channel-helper';
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
