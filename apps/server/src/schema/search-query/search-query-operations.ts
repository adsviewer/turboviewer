import { OrganizationRoleEnum, prisma } from '@repo/database';
import { GraphQLError } from 'graphql/index';
import { builder } from '../builder';
import { SearchQueryDto } from './search-query-types';

builder.queryFields((t) => ({
  searchQueryStrings: t.withAuth({ isInOrg: true }).prismaField({
    type: [SearchQueryDto],
    nullable: false,
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.searchQueryString.findMany({
        ...query,
        where: {
          OR: [{ parentId: ctx.currentUserId }, { parentId: ctx.organizationId }],
        },
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  upsertSearchQueryString: t.withAuth({ isInOrg: true }).prismaField({
    type: SearchQueryDto,
    nullable: false,
    args: {
      id: t.arg.string({ required: false }),
      isOrganization: t.arg.boolean({ required: true }),
      name: t.arg.string({ required: true }),
      queryString: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (args.isOrganization) {
        const userOrganization = await prisma.userOrganization.findUniqueOrThrow({
          where: { userId_organizationId: { userId: ctx.currentUserId, organizationId: ctx.organizationId } },
        });
        if (userOrganization.role === OrganizationRoleEnum.ORG_MEMBER) {
          throw new GraphQLError('You do not have permission to upsert a search query for the organization');
        }
      }
      if (args.id) {
        return prisma.searchQueryString.update({
          ...query,
          where: { id: args.id },
          data: {
            isOrganization: args.isOrganization,
            queryString: args.queryString,
            name: args.name,
          },
        });
      }
      return prisma.searchQueryString.create({
        ...query,
        data: {
          isOrganization: args.isOrganization,
          queryString: args.queryString,
          name: args.name,
          parentId: args.isOrganization ? ctx.organizationId : ctx.currentUserId,
        },
      });
    },
  }),
  deleteSearchQueryString: t.withAuth({ isInOrg: true }).prismaField({
    type: SearchQueryDto,
    nullable: false,
    args: {
      id: t.arg.string({ required: true }),
      isOrganization: t.arg.boolean({ required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (args.isOrganization) {
        const userOrganization = await prisma.userOrganization.findUniqueOrThrow({
          where: { userId_organizationId: { userId: ctx.currentUserId, organizationId: ctx.organizationId } },
        });
        if (userOrganization.role === OrganizationRoleEnum.ORG_MEMBER) {
          throw new GraphQLError('You do not have permission to delete a search query for the organization');
        }
      }
      return prisma.searchQueryString.delete({
        ...query,
        where: { id: args.id },
      });
    },
  }),
}));
