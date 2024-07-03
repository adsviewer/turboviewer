import { EmailType, OrganizationRoleEnum, prisma, UserOrganizationStatus } from '@repo/database';
import { GraphQLError } from 'graphql';
import { builder } from '../builder';
import { OrganizationDto } from '../organization/org-types';
import { userWithRoles } from '../../contexts/user';
import { createJwts } from '../../auth';
import { TokensDto } from './user-types';

builder.queryFields((t) => ({
  organization: t.withAuth({ isInOrg: true }).prismaField({
    type: OrganizationDto,
    resolve: (query, _root, _args, ctx, _info) => {
      return prisma.organization.findUniqueOrThrow({
        ...query,
        where: { id: ctx.organizationId },
      });
    },
  }),

  userOrganizations: t.withAuth({ isInOrg: true }).prismaField({
    type: [OrganizationDto],
    resolve: (query, _root, _args, ctx, _info) => {
      return prisma.organization.findMany({
        ...query,
        where: { users: { some: { userId: ctx.currentUserId } } },
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  updateOrganization: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).prismaField({
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
  createOrganization: t.withAuth({ authenticated: true }).prismaField({
    type: OrganizationDto,
    args: {
      name: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: ctx.currentUserId },
      });

      const domain = user.emailType === EmailType.WORK ? RegExp(/.*@(?<domain>\S+)/).exec(user.email)?.[1] : undefined;

      if (domain) {
        const existingDomain = await prisma.organization.findUnique({
          where: { domain },
        });
        if (existingDomain) {
          throw new GraphQLError(
            'There is already an organization with that domain, please contact the organization administration for access',
          );
        }
      }
      return prisma.organization.create({
        ...query,
        data: {
          name: args.name,
          domain,
          users: {
            create: {
              userId: ctx.currentUserId,
              status: UserOrganizationStatus.ACTIVE,
              role: OrganizationRoleEnum.ORG_ADMIN,
            },
          },
        },
      });
    },
  }),

  deleteOrganization: t.withAuth({ authenticated: true }).prismaField({
    type: OrganizationDto,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const deleteOrg = () =>
        prisma.organization.delete({
          ...query,
          where: { id: args.organizationId },
        });
      if (ctx.isOrgAdmin && ctx.organizationId === args.organizationId) {
        return deleteOrg();
      }
      const userOrg = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: { organizationId: args.organizationId, userId: ctx.currentUserId },
          role: OrganizationRoleEnum.ORG_ADMIN,
        },
      });
      if (!userOrg) {
        throw new GraphQLError('You do not have permission to delete this organization');
      }
      return deleteOrg();
    },
  }),

  switchOrganization: t.withAuth({ authenticated: true }).field({
    type: TokensDto,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      if (ctx.organizationId === args.organizationId) {
        throw new GraphQLError('You are already in this organization');
      }
      const user = await prisma.user.findUnique({
        ...userWithRoles,
        where: { id: ctx.currentUserId, organizations: { some: { organizationId: args.organizationId } } },
      });
      if (!user) {
        throw new GraphQLError('You do not have permission to switch to this organization');
      }
      const updatedUser = await prisma.user.update({
        ...userWithRoles,
        where: { id: user.id },
        data: { currentOrganizationId: args.organizationId },
      });
      const { token, refreshToken } = await createJwts(updatedUser);
      return { token, refreshToken };
    },
  }),
}));
