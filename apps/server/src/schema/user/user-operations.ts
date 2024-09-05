import { randomUUID } from 'node:crypto';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { EmailType, OrganizationRoleEnum, prisma } from '@repo/database';
import { isAError, PasswordSchema } from '@repo/utils';
import { redisDel, redisGet, redisSet } from '@repo/redis';
import { createId } from '@paralleldrive/cuid2';
import * as changeCase from 'change-case';
import { createJwts } from '../../auth';
import {
  activateInvitedUser,
  confirmEmail,
  createPassword,
  createUser,
  passwordsMatch,
} from '../../contexts/user/user';
import { sendForgetPasswordEmail } from '../../email';
import { builder } from '../builder';
import { env } from '../../config';
import { getInvitationRedis, handleLinkInvite, isConfirmInvitedUser } from '../../contexts/user/user-invite';
import { userWithRoles } from '../../contexts/user/user-roles';
import { validateEmail } from '../../emailable-helper';
import { SignUpInputDto, TokensDto, UserDto } from './user-types';

const usernameSchema = z.string().min(2).max(30);
const emailSchema = z.string().email();

builder.queryFields((t) => ({
  me: t.withAuth({ authenticated: true, emailUnconfirmed: true }).prismaField({
    type: UserDto,
    nullable: false,
    resolve: async (query, root, args, ctx, _info) => {
      return await prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: ctx.currentUserId },
      });
    },
  }),

  refreshToken: t.withAuth({ refresh: true }).field({
    description: 'Uses the refresh token to generate a new token',
    type: 'String',
    nullable: false,
    resolve: async (_root, _args, ctx, _info) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.currentUserId },
        include: { roles: { select: { role: true } } },
      });
      if (!user) {
        throw new GraphQLError('User not found');
      }
      const { token } = await createJwts(user);
      return token;
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

const createOrg = async (
  emailValidation:
    | { emailType: 'PERSONAL' }
    | {
        domain: string;
        emailType: EmailType;
      },
  orgId: string,
  nonWorkName: string,
) => {
  if (emailValidation.emailType === EmailType.PERSONAL) {
    await prisma.organization.create({
      data: { id: orgId, name: nonWorkName },
    });
  } else {
    const organization = await prisma.organization.findUnique({
      where: { domain: emailValidation.domain },
    });
    if (organization) {
      await prisma.organization.create({
        data: { id: orgId, name: nonWorkName },
      });
    } else {
      const domainName = emailValidation.domain.replace(/\.[^/.]+$/, '');
      await prisma.organization.create({
        data: { id: orgId, name: changeCase.capitalCase(domainName), domain: emailValidation.domain },
      });
    }
  }
};

builder.mutationFields((t) => ({
  signup: t.field({
    nullable: false,
    type: TokensDto,
    args: {
      args: t.arg({ type: SignUpInputDto, required: true }),
    },
    validate: (args) => Boolean(signUpInputSchema.parse(args)),
    resolve: async (root, args, _ctx, _info) => {
      const [existingUser, redisVal] = await Promise.all([
        prisma.user.findUnique({
          where: { email: args.args.email },
        }),
        getInvitationRedis(args.args.inviteHash),
      ]);
      if (isAError(redisVal)) {
        throw new GraphQLError(redisVal.message);
      }
      if (existingUser && !isConfirmInvitedUser(redisVal)) {
        throw new GraphQLError('User already exists');
      }

      if (isConfirmInvitedUser(redisVal)) {
        return await activateInvitedUser({
          userId: redisVal.userId,
          organizationId: redisVal.organizationId,
          firstName: args.args.firstName,
          lastName: args.args.lastName,
          password: args.args.password,
        });
      }

      const emailValidation = await validateEmail(args.args.email);
      if (isAError(emailValidation)) throw new GraphQLError(emailValidation.message);

      const nonWorkName = `${args.args.firstName}'${args.args.firstName.endsWith('s') ? '' : 's'} organization`;

      const newOrgId = createId();

      if (!redisVal) await createOrg(emailValidation, newOrgId, nonWorkName);

      const user = await createUser({
        email: args.args.email,
        emailType: emailValidation.emailType,
        firstName: args.args.firstName,
        lastName: args.args.lastName,
        password: args.args.password,
        organizationId: redisVal?.organizationId ?? newOrgId,
        role: redisVal?.role ?? OrganizationRoleEnum.ORG_ADMIN,
      });

      if (isAError(user)) throw new GraphQLError(user.message);

      await confirmEmail(user);

      // TODO: enable me
      // fireAndForget.add(() =>
      //   sendSignupEmail({
      //     firstName: user.firstName,
      //     email: user.email,
      //   }),
      // );

      return await createJwts(user);
    },
  }),
  login: t.field({
    type: TokensDto,
    nullable: false,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
      token: t.arg.string({ required: false }),
    },
    validate: (args) => Boolean(loginSchema.parse(args)),
    resolve: async (root, args, _ctx, _info) => {
      const user = await prisma.user.findUnique({
        ...userWithRoles,
        where: { email: args.email },
      });
      if (!user) {
        throw new GraphQLError('Invalid credentials');
      }
      const valid = await passwordsMatch(args.password, user.password);
      if (!valid) {
        throw new GraphQLError('Invalid credentials');
      }
      const jwts = await handleLinkInvite(user, args.token);
      if (isAError(jwts)) {
        throw new GraphQLError(jwts.message);
      }
      return jwts;
    },
  }),
  updateUser: t.withAuth({ authenticated: true }).prismaField({
    type: UserDto,
    nullable: false,
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
    nullable: false,
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

      await Promise.all([
        redisSet(`forget-password:${token}`, user.id, forgotPasswordDurationSec),
        sendForgetPasswordEmail({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          actionUrl: url.toString(),
        }),
      ]);
      return true;
    },
  }),
  resetPassword: t.field({
    nullable: false,
    type: TokensDto,
    args: {
      token: t.arg.string({ required: true, validate: { uuid: true } }),
      password: t.arg.string({
        required: true,
        validate: {
          schema: PasswordSchema,
        },
      }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      const userId = await redisGet<string>(`forget-password:${args.token}`);

      if (!userId) {
        throw new GraphQLError('Token expired');
      }

      const password = await createPassword(args.password);
      const [user, _] = await Promise.all([
        await prisma.user.update({
          ...userWithRoles,
          where: { id: userId },
          data: { password },
        }),
        await redisDel(`forget-password:${args.token}`),
      ]);

      return await createJwts(user);
    },
  }),
  resendEmailConfirmation: t.withAuth({ emailUnconfirmed: true }).boolean({
    nullable: false,
    resolve: async (_root, _args, ctx, _info) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: ctx.currentUserId },
      });
      const emailSent = await confirmEmail(user);
      if (isAError(emailSent)) {
        throw new GraphQLError(emailSent.message);
      }
      return true;
    },
  }),
  emulateAdmin: t.withAuth({ isAdmin: true }).field({
    type: TokensDto,
    nullable: false,
    args: {
      organizationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      const admin = await prisma.user.findFirstOrThrow({
        ...userWithRoles,
        where: {
          organizations: { some: { organizationId: args.organizationId, role: OrganizationRoleEnum.ORG_ADMIN } },
        },
      });
      return createJwts(admin);
    },
  }),
}));
