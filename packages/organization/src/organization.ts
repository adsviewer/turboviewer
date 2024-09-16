import { type Organization, Prisma, Tier, prisma } from '@repo/database';
import { tierConstraints } from '@repo/mappings';
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

export const getTier = async (organizationId?: string): Promise<Tier> => {
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
  const disconnectIntegration = async (maxIntegrations: number, orgId: string): Promise<void> => {
    const integrations = await prisma.integration.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (integrations.length > maxIntegrations) {
      const integrationsToDisconnect = integrations.slice(1);

      integrationsToDisconnect.forEach((integration) => {
        fireAndForget.add(() => revokeIntegration(integration.externalId, integration.type));
      });
    }
  };
  const removeUserFromOrganization = async (
    orgId: string,
    orgUsers: OrganizationWithUsers[`users`],
    tier: Tier,
    subOrganizations: OrganizationWithUsers[],
  ): Promise<void> => {
    const maxUsersInTier = tierConstraints[tier].maxUsers;

    if (tier !== Tier.Launch && tier !== Tier.Build && tier !== Tier.Grow) {
      return;
    }

    await disconnectIntegration(maxUsersInTier, orgId);

    const allUsers = [...orgUsers];
    subOrganizations.forEach((subOrg) => allUsers.push(...subOrg.users));

    const sortedUsers = allUsers.sort(
      (a, b) => new Date(a.user.createdAt).getTime() - new Date(b.user.createdAt).getTime(),
    );

    const usersToKeep = sortedUsers.slice(0, maxUsersInTier);

    const adminInKeptUsers = usersToKeep.some((user) => user.role === 'ORG_ADMIN');

    if (!adminInKeptUsers) {
      const oldestAdmin = sortedUsers.find((user) => user.role === 'ORG_ADMIN');
      if (oldestAdmin) {
        usersToKeep.pop();
        usersToKeep.push(oldestAdmin);
      }
    }

    const usersToRemove = allUsers.filter((user) => !usersToKeep.some((keep) => keep.userId === user.userId));
    const subOrgIds = subOrganizations.map((subOrg) => subOrg.id);
    const organizationIds = [orgId, ...subOrgIds];

    await prisma.userOrganization.deleteMany({
      where: {
        userId: { in: usersToRemove.map((userOrg) => userOrg.userId) },
        organizationId: { in: organizationIds },
      },
    });

    for (const subOrg of subOrganizations) {
      const subOrgAdmin = subOrg.users.find((user) => user.role === 'ORG_ADMIN');
      if (!subOrgAdmin) {
        const rootOrgAdmin = usersToKeep.find((user) => user.role === 'ORG_ADMIN');
        if (rootOrgAdmin) {
          await prisma.userOrganization.update({
            where: { userId_organizationId: { userId: rootOrgAdmin.userId, organizationId: subOrg.id } },
            data: { role: 'ORG_ADMIN' },
          });
        }
      }
    }
  };

  const organization = await prisma.organization.findUniqueOrThrow({
    ...query,
    where: { id: organizationId },
    ...organizationWithUsers,
  });

  const currentTier = organization.tier;

  if (currentTier === newTier) {
    return organization;
  }

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

  await removeUserFromOrganization(organizationId, organization.users, newTier, subOrganizations);

  const updatedOrganization = await prisma.organization.update({
    ...query,
    where: { id: organizationId },
    data: {
      tier: newTier,
      children: {
        updateMany: {
          where: { parentId: organizationId },
          data: { tier: newTier },
        },
      },
    },
  });

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
