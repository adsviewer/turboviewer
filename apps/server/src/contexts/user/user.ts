import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { EmailType, OrganizationRoleEnum, prisma, type User, UserOrganizationStatus, UserStatus } from '@repo/database';
import { canAddUser, maxUsersPerTier } from '@repo/mappings';
import { AError, isAError } from '@repo/utils';
import * as changeCase from 'change-case';
import { logger } from '@repo/logger';
import { createId } from '@paralleldrive/cuid2';
import { redisDel, redisGet, redisSet } from '@repo/redis';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { validateEmail } from '../../emailable-helper';
import { env } from '../../config';
import { sendConfirmEmail } from '../../email';
import { createJwts, type TokensType } from '../../auth';
import {
  type LoginDataPassword,
  type LoginDataProvider,
  type LoginProviderUserData,
  type SignupDataPassword,
  type SignupDataProvider,
} from '../login-provider/login-provider-types';
import { deleteRedisInvite, redisGetInvitationLink } from './user-invite';
import { userWithRoles } from './user-roles';

const scryptAsync = promisify(scrypt);

const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
};

const comparePassword = async (suppliedPassword: string, storedPassword: string) => {
  // split() returns array
  const [hashedPassword, salt] = storedPassword.split('.');
  // we need to pass buffer values to timingSafeEqual
  const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
  // we hash the new sign-in password
  const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
  // compare the new supplied password with the stored hashed password
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
};

export const createPassword = async (password: string) => await hashPassword(password);

export const passwordsMatch = async (password: string, hashedPassword: string | null) => {
  if (!hashedPassword) {
    return false;
  }
  return await comparePassword(password, hashedPassword);
};

export const activateInvitedUser = async (args: LoginDataProvider | LoginDataPassword) => {
  const { userId, firstName, lastName, organizationId } = args;
  const [user] = await Promise.all([
    prisma.user.update({
      ...userWithRoles,
      where: { id: userId },
      data: {
        firstName,
        lastName,
        status: UserStatus.EMAIL_CONFIRMED,
        currentOrganizationId: organizationId,
        ...('password' in args
          ? { password: await createPassword(args.password) }
          : {
              loginProviders: {
                create: {
                  externalId: args.providerId,
                  provider: args.providerType,
                },
              },
            }),
      },
    }),
    prisma.userOrganization.update({
      where: { userId_organizationId: { userId, organizationId } },
      data: {
        status: UserOrganizationStatus.ACTIVE,
      },
    }),
    deleteRedisInvite(userId, organizationId),
  ]);
  return await createJwts(user);
};

export const createUser = async (args: SignupDataProvider | SignupDataPassword) => {
  const { organizationId, lastName, firstName, email, emailType, role } = args;

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const userOrganizationCount = await prisma.userOrganization.count({
    where: { organizationId },
  });

  const currentTier = organization.tier;

  if (!canAddUser(currentTier, userOrganizationCount)) {
    return new AError(
      `Cannot add more users. The maximum number of users for the ${currentTier} tier is ${maxUsersPerTier[currentTier].maxUsers.toString()}.`,
    );
  }

  return await prisma.user.create({
    ...userWithRoles,
    data: {
      email,
      firstName,
      lastName,
      emailType,
      status: 'password' in args ? UserStatus.EMAIL_UNCONFIRMED : UserStatus.EMAIL_CONFIRMED,
      currentOrganizationId: organizationId,
      ...('password' in args
        ? { password: await createPassword(args.password) }
        : {
            loginProviders: {
              create: {
                externalId: args.providerId,
                provider: args.providerType,
              },
            },
          }),
      organizations: {
        create: {
          status: UserOrganizationStatus.ACTIVE,
          role,
          organizationId,
        },
      },
    },
  });
};

export const createLoginProviderUser = async (data: LoginProviderUserData, inviteHash: string | undefined) => {
  const validData = await validateEmailProcess(data.firstName, data.email, inviteHash);
  if (isAError(validData)) {
    return validData;
  }
  return await createUser({
    ...data,
    ...validData,
    role: OrganizationRoleEnum.ORG_ADMIN,
    organizationId: validData.orgId,
  });
};

export const authConfirmUserEmailEndpoint = '/user/confirm-email';

export const authConfirmUserEmailCallback = (req: ExpressRequest, res: ExpressResponse): void => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    res.redirect(`${env.PUBLIC_URL}?error=${encodeURIComponent('Missing parameters')}`);
    return;
  }
  completeConfirmUserEmailCallback(token)
    .then((response) => {
      if (isAError(response)) {
        res.redirect(`${env.PUBLIC_URL}?error=${encodeURIComponent(response.message)}`);
      } else {
        res.redirect(
          `${env.PUBLIC_URL}/api/auth/sign-in?token=${response.token}&refreshToken=${response.refreshToken}`,
        );
      }
    })
    .catch((e: unknown) => {
      logger.error(e, 'Failed to complete email confirmation');
      res.redirect(`${env.PUBLIC_URL}?error=unknown_error`);
    });
};

const confirmEmailRedisKey = (token: string) => `confirm-email:${token}`;
const completeConfirmUserEmailCallback = async (token: string): Promise<TokensType | AError> => {
  const key = confirmEmailRedisKey(token);
  const userId = await redisGet<string>(key);
  if (!userId) {
    return new AError('Token expired');
  }
  const [user, _] = await Promise.all([
    prisma.user.update({
      ...userWithRoles,
      where: { id: userId },
      data: { status: UserStatus.EMAIL_CONFIRMED },
    }),
    redisDel(key),
  ]);
  return await createJwts(user);
};

const validateEmailProcess = async (
  firstName: string,
  email: string,
  inviteHash?: string | null,
): Promise<AError | { orgId: string; emailType: EmailType; role?: OrganizationRoleEnum }> => {
  const nonWorkName = `${firstName}'${firstName.endsWith('s') ? '' : 's'} organization`;

  const { orgId, role } = await (async () => {
    if (!inviteHash) {
      return { orgId: createId() };
    }
    const redisVal = await redisGetInvitationLink(inviteHash);
    if (!redisVal) {
      return { orgId: createId() };
    }
    return { orgId: redisVal.organizationId, role: redisVal.role };
  })();

  const emailValidation = await validateEmail(email);
  if (isAError(emailValidation)) {
    return emailValidation;
  }
  if (emailValidation.emailType === EmailType.PERSONAL) {
    await prisma.organization.create({
      data: { id: orgId, name: nonWorkName },
    });
    return { orgId, emailType: EmailType.PERSONAL, role };
  }
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
  return { orgId, emailType: EmailType.WORK, role };
};

export const confirmEmail = async (user: User): Promise<undefined | AError> => {
  const confirmEmailExpirationInDays = 15;
  const confirmEmailDurationSec = 3600 * 24 * confirmEmailExpirationInDays;
  const confirmEmailResendDurationSec = 60; // 1 minute
  const resendKey = `confirm-email-resent:${user.email}`;

  const resend = await redisGet<string>(resendKey);
  const now = new Date();
  if (resend) {
    const resendDate = new Date(resend);
    const resendExpires = (now.getTime() - resendDate.getTime()) / 1000;
    return new AError(`Please wait ${String(resendExpires)} seconds before requesting another email confirmation.`);
  }
  const token = randomUUID();
  const searchParams = new URLSearchParams();

  searchParams.set('token', token);

  const url = new URL(`${env.API_ENDPOINT}${authConfirmUserEmailEndpoint}`);
  url.search = searchParams.toString();

  await Promise.all([
    redisSet(confirmEmailRedisKey(token), user.id, confirmEmailDurationSec),
    redisSet(resendKey, new Date(), confirmEmailResendDurationSec),
    sendConfirmEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      expirationInDays: confirmEmailExpirationInDays,
      actionUrl: url.toString(),
    }),
  ]);
};
