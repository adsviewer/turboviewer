import { redisDel, redisGet } from '@repo/redis';
import { GraphQLError } from 'graphql/index';
import { isAError } from '@repo/utils';
import { prisma, UserOrganizationStatus, UserStatus } from '@repo/database';
import { builder } from '../builder';
import { type ConfirmInvitedUser, confirmInvitedUserRedisKey, createPassword } from '../../contexts/user/user';
import { createJwts } from '../../auth';
import { acceptLinkInvitationExistingUser } from '../../contexts/user/user-invite';
import { userWithRoles } from '../../contexts/user/user-roles';
import { TokensDto } from './user-types';

builder.queryFields((t) => ({
  checkConfirmInvitedUserTokenValidity: t.field({
    type: 'Boolean',
    nullable: false,
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      const key = confirmInvitedUserRedisKey(args.token);
      const redisVal = await redisGet<ConfirmInvitedUser>(key);
      return Boolean(redisVal);
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
      const key = confirmInvitedUserRedisKey(args.inviteHash);
      const redisVal = await redisGet<ConfirmInvitedUser>(key);
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
        redisDel(key),
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
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const jwts = await acceptLinkInvitationExistingUser(args.token, ctx.currentUserId);
      if (isAError(jwts)) {
        throw new GraphQLError(jwts.message);
      }
      return jwts;
    },
  }),
}));
