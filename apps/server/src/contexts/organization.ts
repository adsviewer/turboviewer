import { prisma, Tier } from '@repo/database';

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
