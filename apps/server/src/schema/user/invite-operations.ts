import { GraphQLError } from 'graphql/index';
import { FireAndForget, inviteHashLabel, isAError } from '@repo/utils';
import { OrganizationRoleEnum, prisma, UserOrganizationStatus, UserStatus } from '@repo/database';
import { logger } from '@repo/logger';
import { redisDel, redisGet, redisGetKeys, redisSet } from '@repo/redis';
import { builder } from '../builder';
import { createPassword } from '../../contexts/user/user';
import { createJwts } from '../../auth';
import {
  acceptLinkInvitationExistingUser,
  authConfirmInvitedUserEndpoint,
  createInvitedUser,
  deleteRedisInvite,
  generateConfirmInvitedUserToken,
  generateInvitationLinkHash,
  getConfirmedInvitedUser,
  invitationExpirationInDays,
  invitationLinkRedisStaticKey,
  redisDellInvitationLink,
  redisSetInvitationLink,
  setConfirmInvitedUserRedis,
} from '../../contexts/user/user-invite';
import { userWithRoles } from '../../contexts/user/user-roles';
import { InviteLinkDto, InviteUsersErrors, OrganizationRoleEnumDto } from '../organization/org-types';
import { env } from '../../config';
import { sendOrganizationInviteConfirmEmail } from '../../email';
import { validateEmail } from '../../emailable-helper';
import { TokensDto } from './user-types';

const fireAndForget = new FireAndForget();

const generateInvitationLink = (inviteHash: string) => {
  const url = new URL(`${env.PUBLIC_URL}/organization-invitation-link`);
  const searchParams = new URLSearchParams();
  searchParams.set(inviteHashLabel, inviteHash);
  url.search = searchParams.toString();
  return url;
};

builder.queryFields((t) => ({
  checkConfirmInvitedUserHashValidity: t.field({
    type: 'Boolean',
    nullable: false,
    args: {
      invitedHash: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx, _info) => Boolean(await getConfirmedInvitedUser(args.invitedHash)),
  }),

  inviteLinks: t.withAuth({ isInOrg: true, isOrgOperator: true }).field({
    type: [InviteLinkDto],
    nullable: false,
    description: 'Returns the invitation links for the signed in org',
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
          const inviteHash = (await redisGet<string>(key))!;
          return { role, url: generateInvitationLink(inviteHash).toString() };
        }),
      );
    },
  }),
}));

builder.mutationFields((t) => ({
  signUpInvitedUser: t.field({
    nullable: false,
    description:
      "Use this mutation after the user has clicked on the personalized invite link on their email and they don't have an account yet",
    type: TokensDto,
    args: {
      firstName: t.arg.string({ required: true }),
      lastName: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
      inviteHash: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      const redisVal = await getConfirmedInvitedUser(args.inviteHash);
      if (!redisVal) {
        throw new GraphQLError('User invitation expired');
      }
      const { userId, organizationId } = redisVal;
      const [user] = await Promise.all([
        prisma.user.update({
          ...userWithRoles,
          where: { id: userId },
          data: {
            firstName: args.firstName,
            lastName: args.lastName,
            password: await createPassword(args.password),
            status: UserStatus.EMAIL_CONFIRMED,
          },
        }),
        prisma.userOrganization.update({
          where: { userId_organizationId: { userId, organizationId } },
          data: { status: UserOrganizationStatus.ACTIVE, user: { update: { currentOrganizationId: organizationId } } },
        }),
        deleteRedisInvite(userId, organizationId),
      ]);
      const { token, refreshToken } = await createJwts(user);
      return { token, refreshToken };
    },
  }),
  acceptLinkInvitationExistingUser: t.withAuth({ authenticated: true }).field({
    description:
      'Use this mutation after the user has clicked on the non-personalized invite link and they have an account already',
    type: TokensDto,
    nullable: false,
    args: {
      inviteHash: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const jwts = await acceptLinkInvitationExistingUser(args.inviteHash, ctx.currentUserId);
      if (isAError(jwts)) {
        throw new GraphQLError(jwts.message);
      }
      return jwts;
    },
  }),

  inviteUsers: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).field({
    type: 'Boolean',
    nullable: false,
    errors: { types: [InviteUsersErrors] },
    args: {
      emails: t.arg.stringList({ required: true, validate: { items: { email: true } } }),
      role: t.arg({ type: OrganizationRoleEnumDto, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      if (ctx.isOrgOperator && args.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError('Only organization administrators can invite organization administrators');
      }

      const frontEndInvitedUserUrl = new URL(`${env.PUBLIC_URL}/sign-up`);

      const [usersMap, organization] = await Promise.all([
        prisma.user
          .findMany({
            where: {
              email: { in: args.emails },
            },
            include: { organizations: true, loginProviders: true },
          })
          .then((users) => new Map(users.map((user) => [user.email, user]))),
        prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } }),
      ]);

      const errors = await Promise.all(
        args.emails.map(async (email) => {
          const inviteHash = generateConfirmInvitedUserToken();
          const dbUser = usersMap.get(email);
          if (dbUser) {
            // Don't re-invite users that are already active in the organization and in the same or higher role
            const userOrganization = dbUser.organizations.find((o) => o.organizationId === ctx.organizationId);
            const roles = Object.values(OrganizationRoleEnum);
            if (
              userOrganization?.status === UserOrganizationStatus.ACTIVE &&
              roles.indexOf(args.role) >= roles.indexOf(userOrganization.role)
            ) {
              return;
            }

            // Create the action url. If the user has no password and no login providers, it means the user needs to create a password or link a login provider
            const url =
              !dbUser.password && dbUser.loginProviders.length === 0
                ? frontEndInvitedUserUrl
                : new URL(`${env.API_ENDPOINT}${authConfirmInvitedUserEndpoint}`);
            const searchParams = new URLSearchParams();
            searchParams.set(inviteHashLabel, inviteHash);
            searchParams.set('email', email);
            url.search = searchParams.toString();

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
                email,
                organizationName: organization.name,
                expirationInDays: invitationExpirationInDays,
                actionUrl: url.toString(),
              }),
              setConfirmInvitedUserRedis(inviteHash, dbUser.id, ctx.organizationId),
            ]);
          } else {
            const emailValidation = await validateEmail(email);
            if (isAError(emailValidation)) return { email, message: emailValidation.message };
            const emailType = emailValidation.emailType;
            // Create the action url for new users
            const searchParams = new URLSearchParams();
            searchParams.set(inviteHashLabel, inviteHash);
            searchParams.set('email', email);
            frontEndInvitedUserUrl.search = searchParams.toString();
            logger.info(`Confirm invited non-existing user ${email}: ${frontEndInvitedUserUrl.toString()}`);

            const newUser = await createInvitedUser(email, emailType, args.role, ctx.organizationId);
            await Promise.all([
              sendOrganizationInviteConfirmEmail({
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email,
                organizationName: organization.name,
                expirationInDays: invitationExpirationInDays,
                actionUrl: frontEndInvitedUserUrl.toString(),
              }),
              setConfirmInvitedUserRedis(inviteHash, newUser.id, ctx.organizationId),
            ]);
          }
        }),
      );
      const flattenErrors = errors.flatMap((e) => e ?? []);
      if (!flattenErrors.length) return true;
      throw new InviteUsersErrors(flattenErrors);
    },
  }),

  createInvitationLink: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).field({
    type: 'String',
    nullable: false,
    description: 'Creates a link for the signed in org for a specific role',
    args: {
      role: t.arg({ type: OrganizationRoleEnumDto, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      if (ctx.isOrgOperator && args.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError('Only organization administrators can invite organization administrators');
      }
      const existingToken = await redisGet<string>(invitationLinkRedisDbKey(ctx.organizationId, args.role));
      const inviteHash = existingToken ?? generateInvitationLinkHash();
      const url = generateInvitationLink(inviteHash);
      logger.info(`Invite ${args.role} link: ${url.toString()}`);

      if (!existingToken) {
        fireAndForget.add(() => redisSet(invitationLinkRedisDbKey(ctx.organizationId, args.role), inviteHash));
        fireAndForget.add(() => redisSetInvitationLink(inviteHash, ctx.organizationId, args.role));
      }

      return url.toString();
    },
  }),

  deleteInvitationLink: t.withAuth({ isOrgAdmin: true, isOrgOperator: true }).field({
    type: 'Boolean',
    nullable: false,
    description: 'Deletes the invitation link for the given role',
    args: {
      role: t.arg({ type: OrganizationRoleEnumDto, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      if (ctx.isOrgOperator && args.role === OrganizationRoleEnum.ORG_ADMIN) {
        throw new GraphQLError(
          'Only organization administrators can delete organization administrators invitation links',
        );
      }
      const existingToken = await redisGet<string>(invitationLinkRedisDbKey(ctx.organizationId, args.role));
      if (!existingToken) {
        return false;
      }
      fireAndForget.add(() =>
        Promise.all([
          redisDel(invitationLinkRedisDbKey(ctx.organizationId, args.role)),
          redisDellInvitationLink(existingToken),
        ]),
      );
      return true;
    },
  }),
}));

const invitationLinkRedisDbKey = (organizationId: string, role: OrganizationRoleEnum) =>
  `${invitationLinkRedisStaticKey}:${organizationId}:${role}`;
