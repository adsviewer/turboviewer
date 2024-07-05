import { randomUUID } from 'node:crypto';
import { redisDel, redisGet, redisSet } from '@repo/redis';
import { OrganizationRoleEnum, prisma, UserOrganizationStatus } from '@repo/database';
import { AError } from '@repo/utils';
import { createJwts, createJwtsFromUserId, type TokensType } from '../../auth';
import { type UserWithRoles } from './user-roles';

export const invitationLinkRedisStaticKey = `organization-invitation-link`;

const invitationLinkRedisKey = (token: string) => `${invitationLinkRedisStaticKey}:${token}`;

interface InvitationLinkRedisValue {
  organizationId: string;
  role: OrganizationRoleEnum;
}

export const invitationLinkTokenPrefix = `link-`;
export const generateInvitationLinkToken = () => `${invitationLinkTokenPrefix}${randomUUID()}`;

export const redisSetInvitationLink = async (token: string, organizationId: string, role: OrganizationRoleEnum) => {
  await redisSet(
    invitationLinkRedisKey(token),
    { organizationId, role } satisfies InvitationLinkRedisValue,
    365 * 24 * 3600,
  );
};

export const redisDellInvitationLink = async (token: string) => {
  await redisDel(invitationLinkRedisKey(token));
};

export const redisGetInvitationLink = async (token: string) => {
  return await redisGet<InvitationLinkRedisValue>(invitationLinkRedisKey(token));
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

export const acceptLinkInvitationExistingUser = async (token: string, userId: string): Promise<TokensType | AError> => {
  const redisVal = await redisGetInvitationLink(token);
  if (!redisVal) {
    return new AError('User invitation expired');
  }
  const { organizationId, role } = redisVal;
  return await handleInvite(userId, organizationId, role);
};

export const handleLinkInvite = async (
  user: UserWithRoles,
  token: string | undefined | null,
): Promise<TokensType | AError> => {
  if (!token) return createJwts(user);
  const redisVal = await redisGetInvitationLink(token);
  if (!redisVal) return createJwts(user);

  const { organizationId, role } = redisVal;
  return await handleInvite(user.id, organizationId, role);
};
