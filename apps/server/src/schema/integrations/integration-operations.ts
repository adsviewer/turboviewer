import { type Integration, IntegrationTypeEnum, prisma } from '@repo/database';
import { builder } from '../builder';
import { IntegrationListItemDto, IntegrationStatus } from './integration-types';

builder.queryFields((t) => ({
  integrations: t.withAuth({ authenticated: true }).field({
    type: [IntegrationListItemDto],
    resolve: async (_root, _args, ctx, _info) => {
      const integrations = await prisma.integration.findMany({
        where: {
          organizationId: ctx.organizationId,
        },
      });

      return Object.values(IntegrationTypeEnum).map((value) => ({
        type: value,
        status: integrationStatus(value, integrations),
      }));
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
