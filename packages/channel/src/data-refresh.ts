import { logger } from '@repo/logger';
import { type Integration, prisma } from '@repo/database';
import { decryptTokens, getAllConnectedIntegrations } from '@repo/channel-utils';
import type { z } from 'zod';
import { type channelIngressInput, type channelIngressOutput } from '@repo/lambda-types';
import { saveChannelData } from './integration-helper';

const refreshDataOf = async (integration: Integration, initial: boolean): Promise<void> => {
  await saveChannelData(integration, initial).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    logger.error(`Error refreshing channel data for ${integration.id}. Error: ${msg}`);
  });
};

const refreshDataAll = async (initial?: boolean): Promise<void> => {
  logger.info('Refreshing all channel data');
  const integrations = await getAllConnectedIntegrations();

  for (const integration of integrations) {
    await refreshDataOf(integration, Boolean(initial));
  }
  logger.info('Refreshed all channel data');
};

export const refreshData = async ({
  initial,
  integrationIds,
}: z.infer<typeof channelIngressInput>): Promise<z.infer<typeof channelIngressOutput>> => {
  if (integrationIds) {
    const integrations = await prisma.integration
      .findMany({
        where: { id: { in: integrationIds } },
      })
      .then((ints) => ints.map(decryptTokens).flatMap((integration) => integration ?? []));
    for (const integration of integrations) {
      await refreshDataOf(integration, initial);
    }
  } else {
    await refreshDataAll(initial);
  }
  return {
    statusCode: 200,
    body: 'Success',
  };
};
