import { IntegrationTypeEnum } from '@repo/database';
import { builder } from '../builder';
import { IntegrationListItemDto, IntegrationStatus } from './integration-types';

builder.queryFields((t) => ({
  integrations: t.withAuth({ authenticated: true }).field({
    type: [IntegrationListItemDto],
    resolve: (_root, _args, _ctx, _info) => {
      return [
        {
          type: IntegrationTypeEnum.FACEBOOK,
          status: IntegrationStatus.ComingSoon,
        },
        {
          type: IntegrationTypeEnum.LINKEDIN,
          status: IntegrationStatus.ComingSoon,
        },
        {
          type: IntegrationTypeEnum.TIKTOK,
          status: IntegrationStatus.ComingSoon,
        },
      ];
    },
  }),
}));
