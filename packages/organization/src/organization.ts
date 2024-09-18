import { type Organization, OrganizationRoleEnum, Prisma, Tier, prisma } from '@repo/database';
import { tierConstraints } from '@repo/mappings';
import { revokeIntegration } from '@repo/channel-utils';
import { AError, FireAndForget } from '@repo/utils';

const fireAndForget = new FireAndForget();

export const getRootOrganizationId = async (organizationId: string): Promise<string> => {
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  if (organization.parentId) {
    return await getRootOrganizationId(organization.parentId);
  }
  return organization.id;
};

export const getTier = async (organizationId: string): Promise<Tier> => {
  const rootOrganizationId = await getRootOrganizationId(organizationId);
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: rootOrganizationId } });

  return organization.tier;
};

export const switchTierHelper = async (
  organizationId: string,
  newTier: Tier,
  query: Omit<Prisma.OrganizationFindUniqueArgs, 'where'>,
): Promise<Organization | AError> => {
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
      const integrationsToDisconnect = integrations.slice(maxIntegrations);

      integrationsToDisconnect.forEach((integration) => {
        fireAndForget.add(() => revokeIntegration(integration.externalId, integration.type));
      });
    }
  };
  const removeUserFromOrganization = async (
    allUsers: OrganizationWithUsers['users'],
    tier: Tier,
    organizations: OrganizationWithUsers[],
  ): Promise<void> => {
    const maxUsersInTier = tierConstraints[tier].maxUsers;
    if (tier !== Tier.Launch && tier !== Tier.Build && tier !== Tier.Grow) {
      return;
    }

    const sortedUsers = Array.from(new Set(allUsers)).sort(
      (a, b) => new Date(a.user.createdAt).getTime() - new Date(b.user.createdAt).getTime(),
    );

    const usersToKeep = sortedUsers.slice(0, maxUsersInTier);

    const oldestAdmin = sortedUsers.find((user) => user.role === OrganizationRoleEnum.ORG_ADMIN);
    if (oldestAdmin) {
      usersToKeep.pop();
      usersToKeep.push(oldestAdmin);
    }

    const usersToRemove = sortedUsers.filter((user) => !usersToKeep.some((keep) => keep.userId === user.userId));
    const orgIds = organizations.map((org) => org.id);
    const organizationIds = [...orgIds];

    await prisma.userOrganization.deleteMany({
      where: {
        userId: { in: usersToRemove.map((userOrg) => userOrg.userId) },
        organizationId: { in: organizationIds },
      },
    });

    for (const org of organizations) {
      const keptUsers = usersToKeep.filter((user) => user.organizationId === org.id);
      if (!keptUsers.some((u) => u.role === OrganizationRoleEnum.ORG_ADMIN) && oldestAdmin) {
        await prisma.userOrganization.update({
          where: { userId_organizationId: { userId: oldestAdmin.userId, organizationId: org.id } },
          data: { role: OrganizationRoleEnum.ORG_ADMIN },
        });
      }
    }
  };

  const organizations = await prisma.organization.findMany({
    where: { OR: [{ id: organizationId }, { parentId: organizationId }] },
    ...organizationWithUsers,
  });

  const isNotRootOrganizationId = organizations.find((org) => org.id === organizationId)?.parentId;
  if (isNotRootOrganizationId) {
    return new AError('Organization id provided is not a root organization');
  }

  const currentTier = organizations[0].tier;

  if (currentTier === newTier) {
    return organizations[0];
  }

  const allUsers = organizations.flatMap((orgItem) => orgItem.users);
  await removeUserFromOrganization(allUsers, newTier, organizations);

  const maxIntegrations = tierConstraints[newTier].maxIntegrations;
  await disconnectIntegration(maxIntegrations, organizationId);

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
