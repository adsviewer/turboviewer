import { randomUUID } from 'node:crypto';
import { redisDel, redisGet, redisSet } from '@repo/redis';
import { type EmailType, OrganizationRoleEnum, prisma, UserOrganizationStatus, UserStatus } from '@repo/database';
import { AError, inviteHashLabel, isAError } from '@repo/utils';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { logger } from '@repo/logger';
import { canAddUser, tierConstraints } from '@repo/mappings';
import { createJwts, createJwtsFromUserId, type TokensType } from '../../auth';
import { env } from '../../config';
import { type UserWithRoles } from './user-roles';

export const invitationExpirationInDays = 15;

const confirmInvitedUserPrefix = `user-`;
export const generateConfirmInvitedUserToken = () => `${confirmInvitedUserPrefix}${randomUUID()}`;
const confirmInvitedUserOrgMapRedisKey = (userId: string, organizationId: string) =>
  `confirm-invited:${userId}:${organizationId}`;
const confirmInvitedUserRedisKey = (inviteHash: string) => `confirm-invited-user:${inviteHash}`;
interface ConfirmInvitedUser {
  userId: string;
  organizationId: string;
}
export const setConfirmInvitedUserRedis = async (inviteHash: string, userId: string, organizationId: string) => {
  await Promise.all([
    redisSet(
      confirmInvitedUserRedisKey(inviteHash),
      { userId, organizationId } satisfies ConfirmInvitedUser,
      3600 * 24 * invitationExpirationInDays,
    ),
    redisSet(confirmInvitedUserOrgMapRedisKey(userId, organizationId), inviteHash),
  ]);
};

export const getConfirmedInvitedUser = async (inviteHash: string): Promise<ConfirmInvitedUser | null> =>
  await redisGet<ConfirmInvitedUser>(confirmInvitedUserRedisKey(inviteHash));

export const deleteRedisInvite = async (userId: string, organizationId: string) => {
  const userOrgInviteVal = await redisGet<string>(confirmInvitedUserOrgMapRedisKey(userId, organizationId));
  if (userOrgInviteVal) {
    await Promise.all([
      redisDel(confirmInvitedUserRedisKey(userOrgInviteVal)),
      redisDel(confirmInvitedUserOrgMapRedisKey(userId, organizationId)),
    ]);
  }
};

export const authConfirmInvitedUserEndpoint = '/user/confirm-invited-user';

export const authConfirmInvitedUserCallback = (req: ExpressRequest, res: ExpressResponse): void => {
  const { [inviteHashLabel]: inviteHash } = req.query;
  if (!inviteHash || typeof inviteHash !== 'string') {
    res.redirect(`${env.PUBLIC_URL}?error=${encodeURIComponent('Missing parameters')}`);
    return;
  }
  completeConfirmInvitedUserCallback(inviteHash)
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

const completeConfirmInvitedUserCallback = async (inviteHash: string): Promise<TokensType | AError> => {
  const key = confirmInvitedUserRedisKey(inviteHash);
  const redisVal = await redisGet<ConfirmInvitedUser>(key);
  if (!redisVal) {
    return new AError('User invitation expired');
  }
  const { userId, organizationId } = redisVal;
  await Promise.all([
    prisma.userOrganization.update({
      where: { userId_organizationId: { userId, organizationId } },
      data: {
        status: UserOrganizationStatus.ACTIVE,
        user: { update: { status: UserStatus.EMAIL_CONFIRMED, currentOrganizationId: organizationId } },
      },
    }),
    redisDel(key),
    redisDel(confirmInvitedUserOrgMapRedisKey(userId, organizationId)),
  ]);
  return await createJwtsFromUserId(userId);
};

export const createInvitedUser = async (
  email: string,
  emailType: EmailType,
  role: OrganizationRoleEnum,
  organizationId: string,
) => {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const userOrganizationCount = await prisma.userOrganization.count({
    where: { organizationId },
  });

  const currentTier = organization.tier;

  if (!canAddUser(currentTier, userOrganizationCount)) {
    return new AError(
      `Cannot add more users. The maximum number of users for the ${currentTier} tier is ${tierConstraints[currentTier].maxUsers.toString()}.`,
    );
  }

  return await prisma.user.create({
    data: {
      email,
      firstName: '',
      lastName: '',
      emailType,
      status: UserStatus.EMAIL_UNCONFIRMED,
      organizations: {
        create: {
          status: UserOrganizationStatus.INVITED,
          role,
          organizationId,
        },
      },
      currentOrganizationId: organizationId,
    },
  });
};

export const invitationLinkRedisStaticKey = `organization-invitation-link`;

const invitationLinkRedisKey = (inviteHash: string) => `${invitationLinkRedisStaticKey}:${inviteHash}`;

interface InvitationLinkRedisValue {
  organizationId: string;
  role: OrganizationRoleEnum;
}

export const isConfirmInvitedUser = (
  value: InvitationLinkRedisValue | ConfirmInvitedUser | null | AError,
): value is ConfirmInvitedUser => {
  if (!value) return false;
  return 'userId' in value;
};

export const getInvitationRedis = async (
  inviteHash: string | undefined | null,
): Promise<AError | InvitationLinkRedisValue | ConfirmInvitedUser | null> => {
  if (!inviteHash) {
    return null;
  }
  const redisVal = inviteHash.startsWith(invitationLinkTokenPrefix)
    ? await redisGetInvitationLink(inviteHash)
    : await getConfirmedInvitedUser(inviteHash);
  if (!redisVal) {
    return new AError(`${inviteHash.startsWith(invitationLinkTokenPrefix) ? 'Link' : 'User'} invitation expired`);
  }
  return redisVal;
};

const invitationLinkTokenPrefix = `link-`;
export const generateInvitationLinkHash = () => `${invitationLinkTokenPrefix}${randomUUID()}`;

export const redisSetInvitationLink = async (
  inviteHash: string,
  organizationId: string,
  role: OrganizationRoleEnum,
) => {
  await redisSet(
    invitationLinkRedisKey(inviteHash),
    { organizationId, role } satisfies InvitationLinkRedisValue,
    365 * 24 * 3600,
  );
};

export const redisDellInvitationLink = async (inviteHash: string) => {
  await redisDel(invitationLinkRedisKey(inviteHash));
};

export const redisGetInvitationLink = async (inviteHash: string) => {
  return await redisGet<InvitationLinkRedisValue>(invitationLinkRedisKey(inviteHash));
};

export const handleInvite = async (
  userId: string,
  organizationId: string,
  role: OrganizationRoleEnum,
): Promise<TokensType | AError> => {
  const userOrganization = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!userOrganization) {
    await prisma.userOrganization.create({
      data: {
        userId,
        organizationId,
        role,
        status: UserOrganizationStatus.ACTIVE,
      },
    });
    return await createJwtsFromUserId(userId);
  }
  const roles = Object.values(OrganizationRoleEnum);
  if (
    userOrganization.status === UserOrganizationStatus.ACTIVE &&
    roles.indexOf(role) >= roles.indexOf(userOrganization.role)
  ) {
    return new AError('User already in organization');
  }

  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    update: { status: UserOrganizationStatus.ACTIVE },
    create: {
      userId,
      organizationId,
      role,
      status: UserOrganizationStatus.ACTIVE,
    },
  });
  return await createJwtsFromUserId(userId);
};

export const acceptLinkInvitationExistingUser = async (
  inviteHash: string,
  userId: string,
): Promise<TokensType | AError> => {
  const redisVal = await redisGetInvitationLink(inviteHash);
  if (!redisVal) {
    return new AError('User invitation expired');
  }
  const { organizationId, role } = redisVal;
  return await handleInvite(userId, organizationId, role);
};

export const handleLinkInvite = async (
  user: UserWithRoles,
  inviteHash: string | undefined | null,
): Promise<TokensType | AError> => {
  if (!inviteHash) return createJwts(user);
  const redisVal = await redisGetInvitationLink(inviteHash);
  if (!redisVal) return createJwts(user);

  const { organizationId, role } = redisVal;
  return await handleInvite(user.id, organizationId, role);
};
