import { randomUUID } from 'node:crypto';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { queryFromInfo } from '@pothos/plugin-prisma';
import { prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { isAError, PasswordSchema } from '@repo/utils';
import { redisDel, redisGet, redisSet } from '@repo/redis';
import lodash from 'lodash';
import { createJwts } from '../../auth';
import { createPassword, createUser, passwordsMatch, userWithRoles } from '../../contexts/user';
import { sendForgetPasswordEmail } from '../../email';
import { builder } from '../builder';
import { env } from '../../config';
import { SignUpInputDto, TokenUserDto, UserDto } from './user-types';

const usernameSchema = z.string().min(2).max(30);
const emailSchema = z.string().email();

builder.queryFields((t) => ({
  me: t.withAuth({ authenticated: true }).prismaField({
    type: UserDto,
    resolve: async (query, root, args, ctx, _info) => {
      return await prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: ctx.currentUserId },
      });
    },
  }),
}));

const signUpInputSchema = z.object({
  args: z.object({
    firstName: usernameSchema,
    lastName: usernameSchema,
    email: emailSchema,
    password: PasswordSchema,
  }),
});

const loginSchema = z.object({
  email: emailSchema,
  // We should not enforce password here, in case we change password strategy
  password: z.string(),
});

const updateUserSchema = z.object({
  firstName: usernameSchema,
  lastName: usernameSchema,
  oldPassword: PasswordSchema.optional(),
  newPassword: PasswordSchema.optional(),
});

builder.mutationFields((t) => ({
  signup: t.field({
    type: TokenUserDto,
    args: {
      args: t.arg({ type: SignUpInputDto, required: true }),
    },
    validate: (args) => Boolean(signUpInputSchema.parse(args)),
    resolve: async (root, args, ctx, info) => {
      const query = queryFromInfo({
        context: ctx,
        info,
        path: ['user'],
      });

      const existingUser = await prisma.user.findUnique({
        where: { email: args.args.email },
      });
      if (existingUser) {
        throw new GraphQLError('User already exists');
      }

      const user = await createUser(args.args, query);
      if (isAError(user)) throw new GraphQLError(user.message);

      // TODO: enable me
      // fireAndForget.add(() =>
      //   sendSignupEmail({
      //     firstName: user.firstName,
      //     email: user.email,
      //   }),
      // );

      const { token, refreshToken } = await createJwts(
        user.id,
        user.defaultOrganizationId,
        user.roles.map((r) => r.role),
      );
      return { token, refreshToken, user };
    },
  }),
  login: t.field({
    type: TokenUserDto,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    validate: (args) => Boolean(loginSchema.parse(args)),
    resolve: async (root, args, ctx, info) => {
      const query = queryFromInfo({
        context: ctx,
        info,
        path: ['user'],
      });
      const user = await prisma.user.findUnique({
        ...lodash.merge({}, query, userWithRoles),
        where: { email: args.email },
      });
      if (!user) {
        throw new GraphQLError('Invalid credentials');
      }
      const valid = await passwordsMatch(args.password, user.password);
      if (!valid) {
        throw new GraphQLError('Invalid credentials');
      }
      const { token, refreshToken } = await createJwts(
        user.id,
        user.defaultOrganizationId,
        user.roles.map((r) => r.role),
      );
      return { token, refreshToken, user };
    },
  }),
  refreshToken: t.withAuth({ refresh: true }).field({
    description: 'Uses the refresh token to generate a new token',
    type: 'String',
    resolve: async (root, args, ctx, _info) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.currentUserId },
        include: { roles: { select: { role: true } } },
      });
      if (!user) {
        throw new GraphQLError('User not found');
      }
      const { token } = await createJwts(
        user.id,
        ctx.organizationId,
        user.roles.map((r) => r.role),
      );
      return token;
    },
  }),
  updateUser: t.withAuth({ authenticated: true }).prismaField({
    type: UserDto,
    args: {
      firstName: t.arg.string(),
      lastName: t.arg.string(),
      newPassword: t.arg.string({ required: false, validate: { schema: PasswordSchema } }),
      oldPassword: t.arg.string({ required: false, validate: { schema: PasswordSchema } }),
    },
    validate: (args) =>
      Boolean(updateUserSchema.parse(args)) && Boolean(args.oldPassword) === Boolean(args.newPassword),
    resolve: async (query, root, args, ctx, _info) => {
      if (args.oldPassword && args.newPassword) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.currentUserId },
        });
        if (!user) {
          throw new GraphQLError('User not found');
        }
        const valid = await passwordsMatch(args.oldPassword, user.password);
        if (!valid) {
          throw new GraphQLError('Invalid old password');
        }
        const password = await createPassword(args.newPassword);
        delete args.oldPassword;
        delete args.newPassword;
        return prisma.user.update({
          ...query,
          where: { id: ctx.currentUserId },
          data: { ...(args as z.infer<typeof updateUserSchema>), password },
        });
      }
      return prisma.user.update({
        ...query,
        where: { id: ctx.currentUserId },
        data: args as z.infer<typeof updateUserSchema>,
      });
    },
  }),
  forgetPassword: t.boolean({
    args: {
      email: t.arg.string({ required: true, validate: { email: true } }),
    },
    resolve: async (root, args, _ctx, _info) => {
      const forgotPasswordDurationSec = 60 * 60 * 24; // 1 day

      const user = await prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) return true;

      const now = new Date();
      const expires = now.getTime() + forgotPasswordDurationSec;

      const token = randomUUID();
      const searchParams = new URLSearchParams();

      // Maybe we base64 encode this
      searchParams.set('token', token);
      searchParams.set('expires', String(expires));
      searchParams.set('email', user.email);

      const url = new URL(`${env.PUBLIC_URL}/reset-password`);
      url.search = searchParams.toString();

      logger.info(`Forget password url for ${user.email}: ${url.toString()}`);

      await Promise.all([
        redisSet(`forget-password:${token}`, user.id, forgotPasswordDurationSec),
        sendForgetPasswordEmail({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          action_url: url.toString(),
          operating_system: _ctx.request.operatingSystem,
          browser_name: _ctx.request.browserName,
        }),
      ]);
      return true;
    },
  }),
  resetPassword: t.field({
    type: TokenUserDto,
    args: {
      token: t.arg.string({ required: true, validate: { uuid: true } }),
      password: t.arg.string({
        required: true,
        validate: {
          schema: PasswordSchema,
        },
      }),
    },
    resolve: async (_root, args, ctx, info) => {
      const userId = await redisGet<string>(`forget-password:${args.token}`);

      if (!userId) {
        throw new GraphQLError('Token expired');
      }

      const password = await createPassword(args.password);
      const query = queryFromInfo({
        context: ctx,
        info,
        path: ['user'],
      });

      const [user, _] = await Promise.all([
        await prisma.user.update({
          ...query,
          where: { id: userId },
          ...userWithRoles,
          data: { password },
        }),
        await redisDel(`forget-password:${args.token}`),
      ]);

      const { token, refreshToken } = await createJwts(
        user.id,
        user.defaultOrganizationId,
        user.roles.map((r) => r.role),
      );
      return { token, refreshToken, user };
    },
  }),
}));
