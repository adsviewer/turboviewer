import { isAError } from '@repo/utils';
import { builder } from '../builder';
import { getChannel } from '../../contexts/channels/channel-helper';
import { IntegrationTypeDto } from './integration-types';

builder.mutationFields((t) => ({
  adIngress: t.withAuth({ authenticated: true }).field({
    type: 'String',
    args: {
      type: t.arg({
        type: IntegrationTypeDto,
        required: true,
      }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const { type } = args;
      const channel = getChannel(type);
      const adIngress = await channel.adIngress(ctx.organizationId, ctx.currentUserId);
      if (isAError(adIngress)) {
        return adIngress.message;
      }
      return 'Ingress started';
    },
  }),
}));
