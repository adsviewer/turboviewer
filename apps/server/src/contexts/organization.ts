import { prisma } from '@repo/database';

export const getRootOrganizationId = async (organizationId: string): Promise<string> => {
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  if (organization.parentId) {
    return await getRootOrganizationId(organizationId);
  }
  return organization.id;
};
