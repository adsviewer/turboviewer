import { type Organization, Prisma, Tier, prisma } from '@repo/database';
import { maxUsersPerTier } from '@repo/mappings';
import { revokeIntegration } from '@repo/channel-utils';
import { FireAndForget } from '@repo/utils';

const fireAndForget = new FireAndForget();

export const getRootOrganizationId = async (organizationId: string): Promise<string> => {
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  if (organization.parentId) {
    return await getRootOrganizationId(organization.parentId);
  }
  return organization.id;
};

export const getTier = async (organizationId?: string | null): Promise<Tier> => {
  if (!organizationId) {
    return Tier.Launch;
  }

  const rootOrganizationId = await getRootOrganizationId(organizationId);
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: rootOrganizationId } });

  return organization.tier;
};

export const switchTierHelper = async (
  organizationId: string,
  newTier: Tier,
  query: Omit<Prisma.OrganizationFindUniqueArgs, 'where'>,
): Promise<Organization> => {
  const organization = await prisma.organization.findUniqueOrThrow({
    ...query,
    where: { id: organizationId },
    ...organizationWithUsers,
  });

  const currentTier = organization.tier;

  if (currentTier === newTier) {
    return organization;
  }

  const disconnectIntegration = async (orgId: string): Promise<void> => {
    const integrationCount = await prisma.integration.count({
      where: {
        organizationId: orgId,
      },
    });

    if (integrationCount > 1) {
      const oldestIntegration = await prisma.integration.findFirst({
        where: {
          organizationId: orgId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (oldestIntegration) {
        fireAndForget.add(() => revokeIntegration(oldestIntegration.externalId, oldestIntegration.type));
      }
    }
  };

  const removeUserFromOrganization = async (
    orgId: string,
    orgUsers: OrganizationWithUsers[`users`],
    tier: Tier,
  ): Promise<void> => {
    const maxUsersInTier = maxUsersPerTier[tier].maxUsers;

    if (tier === Tier.Launch || tier === Tier.Build || tier === Tier.Grow) {
      if (tier === Tier.Launch) {
        await disconnectIntegration(orgId);
      }
      const adminUsers = orgUsers
        .filter((userOrg) => userOrg.role === 'ORG_ADMIN')
        .sort((a, b) => new Date(a.user.createdAt).getTime() - new Date(b.user.createdAt).getTime());

      const regularUsers = orgUsers
        .filter((userOrg) => userOrg.role !== 'ORG_ADMIN')
        .sort((a, b) => new Date(a.user.createdAt).getTime() - new Date(b.user.createdAt).getTime());

      const usersToKeep = [
        ...adminUsers.slice(0, maxUsersInTier),
        ...regularUsers.slice(0, maxUsersInTier - adminUsers.length),
      ].slice(0, maxUsersInTier);

      const usersToRemove = orgUsers.filter((userOrg) => !usersToKeep.some((keep) => keep.userId === userOrg.userId));

      await prisma.userOrganization.deleteMany({
        where: {
          userId: { in: usersToRemove.map((userOrg) => userOrg.userId) },
          organizationId: orgId,
        },
      });
    }
  };

  await removeUserFromOrganization(organizationId, organization.users, newTier);

  const subOrganizations = await prisma.organization.findMany({
    where: { parentId: organizationId },
    include: {
      users: {
        include: {
          user: true,
        },
      },
    },
  });

  for (const subOrg of subOrganizations) {
    await removeUserFromOrganization(subOrg.id, subOrg.users, newTier);
  }

  const [updatedOrganization] = await prisma.$transaction([
    prisma.organization.update({
      ...query,
      where: { id: organizationId },
      data: { tier: newTier },
    }),

    prisma.organization.updateMany({
      where: { parentId: organizationId },
      data: { tier: newTier },
    }),
  ]);

  return updatedOrganization;
};

export const organizationWithUsers = Prisma.validator<Prisma.OrganizationDefaultArgs>()({
  include: {
    users: {
      include: {
        user: true,
      },
    },
  },
});
export type OrganizationWithUsers = Prisma.OrganizationGetPayload<typeof organizationWithUsers>;
