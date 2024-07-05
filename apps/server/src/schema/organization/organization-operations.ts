import { randomUUID } from 'node:crypto';
import { EmailType, OrganizationRoleEnum, prisma, UserOrganizationStatus } from '@repo/database';
import { GraphQLError } from 'graphql';
import { logger } from '@repo/logger';
import { redisDel, redisGet, redisGetKeys, redisSet } from '@repo/redis';
import { FireAndForget } from '@repo/utils';
import { builder } from '../builder';
import {
  authConfirmInvitedUserEndpoint,
  type ConfirmInvitedUser,
  confirmInvitedUserRedisKey,
  createInvitedUser,
  userWithRoles,
} from '../../contexts/user';
import { createJwts } from '../../auth';
import { sendOrganizationInviteConfirmEmail } from '../../email';
import { env } from '../../config';
import { TokensDto } from '../user/user-types';
import { inviteLinkDto, InviteUsersDto, OrganizationDto, OrganizationRoleEnumDto } from './org-types';

const fireAndForget = new FireAndForget();

const generateInvitationLink = (token: string, organizationId: string, role: OrganizationRoleEnum) => {
  const url = new URL(`${env.PUBLIC_URL}/invitation-link`);
  const searchParams = new URLSearchParams();
  searchParams.set('token', token);
  searchParams.set('organizationId', organizationId);
  searchParams.set('role', role);
  url.search = searchParams.toString();
  return url;
};

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

  inviteLinks: t.withAuth({ isInOrg: true, isOrgOperator: true }).field({
    type: [inviteLinkDto],
    resolve: async (_root, _args, ctx, _info) => {
      const roleTokenMap = await redisGetKeys(`${invitationLinkRedisStaticKey}:${ctx.organizationId}:`).then(
        (keys) =>
          new Map<OrganizationRoleEnum, string>(keys.map((key) => [key.split(':')[2] as OrganizationRoleEnum, key])),
      );
      if (ctx.isOrgOperator) {
        roleTokenMap.delete(OrganizationRoleEnum.ORG_ADMIN);
      }

      return await Promise.all(
        Array.from(roleTokenMap.entries()).map(async ([role, key]) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know the key exists
          const token = (await redisGet<string>(key))!;
          return { role, url: generateInvitationLink(token, ctx.organizationId, role).toString() };
        }),
      );
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

  inviteUsers: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).field({
    type: 'Boolean',
    args: {
      users: t.arg({ type: [InviteUsersDto], required: true }),
      role: t.arg({ type: OrganizationRoleEnumDto, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      if (ctx.isOrgOperator && args.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError('Only organization administrators can invite organization administrators');
      }

      const invitationExpirationInDays = 15;

      const setConfirmInvitedUserRedis = async (token: string, userId: string) => {
        await redisSet(
          confirmInvitedUserRedisKey(token),
          { userId, organizationId: ctx.organizationId } satisfies ConfirmInvitedUser,
          3600 * 24 * invitationExpirationInDays,
        );
      };

      const frontEndInvitedUserUrl = new URL(`${env.PUBLIC_URL}/invited-user`);

      const [usersMap, organization] = await Promise.all([
        prisma.user
          .findMany({
            where: {
              email: { in: args.users.map((u) => u.email) },
            },
            include: { organizations: true, loginProviders: true },
          })
          .then((users) => new Map(users.map((user) => [user.email, user]))),
        prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } }),
      ]);

      await Promise.all(
        args.users.map(async (user) => {
          const token = randomUUID();
          const dbUser = usersMap.get(user.email);
          if (dbUser) {
            if (
              // Don't re-invite users that are already active in the organization
              dbUser.organizations.find((o) => o.organizationId === ctx.organizationId)?.status ===
              UserOrganizationStatus.ACTIVE
            ) {
              return;
            }
            // Create the action url. If the user has no password and no login providers, it means the user needs to create a password or link a login provider
            const url =
              !dbUser.password && dbUser.loginProviders.length === 0
                ? frontEndInvitedUserUrl
                : new URL(`${env.API_ENDPOINT}${authConfirmInvitedUserEndpoint}`);
            const searchParams = new URLSearchParams();
            searchParams.set('token', token);
            searchParams.set('email', user.email);
            url.search = searchParams.toString();
            logger.info(`Confirm invited user email url for ${user.email}: ${url.toString()}`);

            await Promise.all([
              prisma.userOrganization.upsert({
                create: {
                  userId: dbUser.id,
                  organizationId: ctx.organizationId,
                  role: args.role,
                  status: UserOrganizationStatus.INVITED,
                },
                update: {
                  role: args.role,
                  status: UserOrganizationStatus.INVITED,
                },
                where: { userId_organizationId: { userId: dbUser.id, organizationId: ctx.organizationId } },
              }),
              sendOrganizationInviteConfirmEmail({
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                email: user.email,
                organizationName: organization.name,
                expirationInDays: invitationExpirationInDays,
                actionUrl: url.toString(),
              }),
              setConfirmInvitedUserRedis(token, dbUser.id),
            ]);
          } else {
            // Create the action url for new users
            const searchParams = new URLSearchParams();
            searchParams.set('token', token);
            searchParams.set('email', user.email);
            frontEndInvitedUserUrl.search = searchParams.toString();
            logger.info(`Confirm invited non-existing user ${user.email}: ${frontEndInvitedUserUrl.toString()}`);

            const newUser = await createInvitedUser({ ...user, role: args.role, organizationId: ctx.organizationId });
            await Promise.all([
              sendOrganizationInviteConfirmEmail({
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: user.email,
                organizationName: organization.name,
                expirationInDays: invitationExpirationInDays,
                actionUrl: frontEndInvitedUserUrl.toString(),
              }),
              setConfirmInvitedUserRedis(token, newUser.id),
            ]);
          }
        }),
      );
      return true;
    },
  }),

  createInvitationLink: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).field({
    type: 'String',
    args: {
      role: t.arg({ type: OrganizationRoleEnumDto, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      if (ctx.isOrgOperator && args.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError('Only organization administrators can invite organization administrators');
      }
      const existingToken = await redisGet<string>(invitationLinkRedisKey(ctx.organizationId, args.role));
      const token = existingToken ?? randomUUID();
      const url = generateInvitationLink(token, ctx.organizationId, args.role);
      logger.info(`Invite ${args.role} link: ${url.toString()}`);

      if (!existingToken) {
        fireAndForget.add(() => redisSet(invitationLinkRedisKey(ctx.organizationId, args.role), token));
      }

      return url.toString();
    },
  }),

  deleteInvitationLink: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).field({
    type: 'Boolean',
    args: {
      role: t.arg({ type: OrganizationRoleEnumDto, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      if (ctx.isOrgOperator && args.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError(
          'Only organization administrators can delete organization administrators invitation links',
        );
      }
      const existingToken = await redisGet<string>(invitationLinkRedisKey(ctx.organizationId, args.role));
      if (!existingToken) {
        return false;
      }
      await redisDel(invitationLinkRedisKey(ctx.organizationId, args.role));
      return true;
    },
  }),
}));

const invitationLinkRedisStaticKey = `organization-invitation-link`;
const invitationLinkRedisKey = (organizationId: string, role: OrganizationRoleEnum) =>
  `${invitationLinkRedisStaticKey}:${organizationId}:${role}`;
