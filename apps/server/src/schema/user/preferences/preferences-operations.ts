import { prisma } from '@repo/database';
import { builder } from '../../builder';
import { PreferencesDto } from './preferences-types';

builder.mutationFields((t) => ({
  updatePreferences: t.withAuth({ isInOrg: true }).prismaField({
    type: PreferencesDto,
    args: {
      idToUpdate: t.arg.string({ required: true }),
      insightsPerRow: t.arg.int({ required: false }),
    },
    resolve: async (query, _parent, args, _ctx) => {
      return await prisma.preferences.update({
        ...query,
        where: { id: args.idToUpdate },
        data: {
          insightsPerRow: args.insightsPerRow ?? undefined,
        },
      });
    },
  }),
}));
