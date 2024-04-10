import type { IntegrationTypeEnum } from '@repo/database';
import { IntegrationStatus, prisma } from '@repo/database';

export const revokeIntegration = async (externalId: string, type: IntegrationTypeEnum): Promise<void> => {
  await prisma.integration.update({
    where: {
      externalId_type: {
        externalId,
        type,
      },
    },
    data: {
      status: IntegrationStatus.REVOKED,
    },
  });
};
