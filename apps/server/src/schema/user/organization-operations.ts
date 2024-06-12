import { prisma } from '@repo/database';
import { builder } from '../builder';
import { OrganizationDto } from '../organization/org-types';

builder.mutationFields((t) => ({
  updateOrganization: t.withAuth({ isOrgAdmin: true }).prismaField({
    type: OrganizationDto,
    args: {
      name: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx, _info) => {
      return prisma.organization.update({
        ...query,
        where: { id: ctx.organizationId },
        data: { name: args.name },
      });
    },
  }),
}));
