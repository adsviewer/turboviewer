import { EmailType, OrganizationRoleEnum, prisma, UserOrganizationStatus, UserStatus } from '@repo/database';
import { GraphQLError } from 'graphql';
import { AError, FireAndForget, isAError } from '@repo/utils';
import { deleteInsightsCache } from '@repo/channel';
import { builder } from '../builder';
import { createJwts } from '../../auth';
import { TokensDto } from '../user/user-types';
import { deleteRedisInvite } from '../../contexts/user/user-invite';
import { userWithRoles } from '../../contexts/user/user-roles';
import { AdAccountDto, IntegrationTypeDto } from '../integrations/integration-types';
import { OrganizationDto, OrganizationRoleEnumDto, UserOrganizationDto } from './org-types';

const fireAndForget = new FireAndForget();

builder.queryFields((t) => ({
  organization: t.withAuth({ isInOrg: true }).prismaField({
    type: OrganizationDto,
    nullable: false,
    resolve: (query, _root, _args, ctx, _info) => {
      return prisma.organization.findUniqueOrThrow({
        ...query,
        where: { id: ctx.organizationId },
      });
    },
  }),

  organizations: t.withAuth({ isAdmin: true }).prismaField({
    type: [OrganizationDto],
    nullable: false,
    resolve: (query, _root, _args, _ctx, _info) => {
      return prisma.organization.findMany({
        ...query,
      });
    },
  }),

  organizationAdAccounts: t.withAuth({ isInOrg: true }).prismaField({
    description: 'Return the adAccounts for a channel that are associated with the organization.',
    type: [AdAccountDto],
    nullable: false,
    args: {
      channel: t.arg({ type: IntegrationTypeDto, required: true }),
    },
    resolve: (query, _root, args, ctx, _info) => {
      return prisma.adAccount.findMany({
        ...query,
        where: { type: args.channel, organizations: { some: { id: ctx.organizationId } } },
      });
    },
  }),

  availableOrganizationAdAccounts: t.withAuth({ isOrgAdmin: true }).prismaField({
    description:
      'Return all the adAccounts for that are available on the parent organization. If this is the root organization then it returns all the addAccounts of this channel.',
    type: [AdAccountDto],
    nullable: false,
    args: {
      channel: t.arg({ type: IntegrationTypeDto, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const { parentId } = await prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } });
      await checkIsAdminInParent(parentId, ctx.currentUserId);
      return await prisma.adAccount.findMany({
        ...query,
        where: { type: args.channel, organizations: { some: { id: parentId ?? ctx.organizationId } } },
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  updateOrganization: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).prismaField({
    type: OrganizationDto,
    nullable: false,
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
    nullable: false,
    grantScopes: ['readOrganization'],
    args: {
      name: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: ctx.currentUserId },
      });

      const domain = await (async () => {
        const domainInner =
          user.emailType === EmailType.WORK ? RegExp(/.*@(?<domain>\S+)/).exec(user.email)?.[1] : undefined;

        if (!domainInner) return undefined;
        const existingDomain = await prisma.organization.findUnique({
          where: { domain: domainInner },
        });
        if (existingDomain) return undefined;
        return domainInner;
      })();

      return prisma.organization.create({
        ...query,
        data: {
          name: args.name,
          domain,
          parentId: ctx.organizationId,
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

  deleteOrganization: t.withAuth({ isOrgAdmin: true, isAdmin: true }).prismaField({
    type: OrganizationDto,
    nullable: false,
    args: {
      organizationId: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const organizationId = args.organizationId ?? ctx.organizationId ?? new AError('No organizationId provided');
      if (isAError(organizationId)) {
        throw new GraphQLError('No organizationId provided');
      }

      if (!((ctx.isOrgAdmin && ctx.organizationId === args.organizationId) ?? ctx.isAdmin)) {
        throw new GraphQLError('You do not have permission to delete this organization');
      }
      const org = await prisma.organization.findUniqueOrThrow({
        include: { children: true },
        where: { id: organizationId },
      });
      if (org.children.length > 0) {
        throw new GraphQLError('Cannot delete an organization that has sub-organizations');
      }
      return prisma.organization.delete({ ...query, where: { id: organizationId } });
    },
  }),

  switchOrganization: t.withAuth({ authenticated: true }).field({
    type: TokensDto,
    nullable: false,
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

  removeUserFromOrganization: t.withAuth({ isInOrg: true }).field({
    type: 'Boolean',
    nullable: false,
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const userOrganization = await prisma.userOrganization.findUnique({
        where: { userId_organizationId: { userId: args.userId, organizationId: ctx.organizationId } },
      });
      if (!userOrganization) {
        throw new GraphQLError('User is not an active member of this organization');
      }
      if (ctx.isOrgOperator && userOrganization.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError('Only organization administrators can remove organization administrators');
      }
      if (ctx.isOrgMember && ctx.currentUserId !== args.userId) {
        throw new GraphQLError('Not authorized to remove other users from the organization');
      }
      if (ctx.currentUserId === args.userId && ctx.isOrgAdmin) {
        const otherAdmins = await prisma.userOrganization.count({
          where: {
            organizationId: ctx.organizationId,
            userId: { not: ctx.currentUserId },
            role: OrganizationRoleEnum.ORG_ADMIN,
            status: UserOrganizationStatus.ACTIVE,
          },
        });
        if (otherAdmins === 0) {
          throw new GraphQLError('Cannot remove the last organization administrator');
        }
      }
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: args.userId },
      });
      fireAndForget.add(() => deleteRedisInvite(args.userId, ctx.organizationId));
      if (user.status === UserStatus.EMAIL_UNCONFIRMED) {
        await prisma.user.delete({ where: { id: args.userId } });
        return true;
      }
      await prisma.userOrganization.delete({
        where: { userId_organizationId: { userId: args.userId, organizationId: ctx.organizationId } },
      });
      if (user.currentOrganizationId === ctx.organizationId) {
        await prisma.user.update({
          where: { id: args.userId },
          data: { currentOrganizationId: null },
        });
      }
      return true;
    },
  }),

  updateOrganizationUser: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).field({
    type: UserOrganizationDto,
    nullable: false,
    args: {
      role: t.arg({ type: OrganizationRoleEnumDto, required: false }),
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const userOrganization = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: { userId: args.userId, organizationId: ctx.organizationId },
          status: UserOrganizationStatus.ACTIVE,
        },
      });
      if (!userOrganization) {
        throw new GraphQLError('User is not an active member of this organization');
      }
      if (ctx.isOrgOperator && userOrganization.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError('Only organization administrators can update organization administrators');
      }
      if (ctx.currentUserId === args.userId && ctx.isOrgAdmin) {
        const otherAdmins = await prisma.userOrganization.count({
          where: {
            organizationId: ctx.organizationId,
            userId: { not: ctx.currentUserId },
            role: OrganizationRoleEnum.ORG_ADMIN,
            status: UserOrganizationStatus.ACTIVE,
          },
        });
        if (otherAdmins === 0) {
          throw new GraphQLError('Cannot remove the last organization administrator');
        }
      }
      return prisma.userOrganization.update({
        where: { userId_organizationId: { userId: args.userId, organizationId: ctx.organizationId } },
        data: {
          role: args.role ?? undefined,
        },
      });
    },
  }),

  updateOrganizationAdAccounts: t.withAuth({ isOrgAdmin: true }).prismaField({
    type: OrganizationDto,
    nullable: false,
    args: {
      integrationType: t.arg({ type: IntegrationTypeDto, required: true }),
      adAccountIds: t.arg.stringList({ required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const { parentId } = await prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } });
      if (!parentId) {
        throw new GraphQLError('Cannot update ad accounts for the root organization');
      }
      await checkIsAdminInParent(parentId, ctx.currentUserId);
      deleteInsightsCache(ctx.organizationId);
      const adAccounts = await prisma.adAccount.findMany({
        where: { type: { not: args.integrationType }, organizations: { some: { id: ctx.organizationId } } },
      });
      const adAccountIds = adAccounts.map((adAccount) => adAccount.id);
      const newAdAccountsIds = [...adAccountIds, ...args.adAccountIds];
      return prisma.organization.update({
        ...query,
        where: { id: ctx.organizationId },
        data: { adAccounts: { set: newAdAccountsIds.map((id) => ({ id })) } },
      });
    },
  }),
}));

const checkIsAdminInParent = async (parentId: string | null, userId: string) => {
  if (parentId) {
    const activeAdminUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: parentId },
        role: OrganizationRoleEnum.ORG_ADMIN,
        status: UserOrganizationStatus.ACTIVE,
      },
    });
    if (!activeAdminUserOrg) {
      throw new GraphQLError('Only administrators of the parent organization are allowed to view/update adAccounts');
    }
  }
};
