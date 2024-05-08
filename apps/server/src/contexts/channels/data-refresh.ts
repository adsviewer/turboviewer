import { logger } from '@repo/logger';
import { type Request, type Response } from 'express';
import { type Integration } from '@repo/database';
import { FireAndForget } from '../../fire-and-forget';
import { getAllConnectedIntegrations } from './integration-util';
import { saveChannelData } from './integration-helper';

const fireAndForget = new FireAndForget();

export const channelDataRefreshWebhook = (_req: Request, res: Response): void => {
  fireAndForget.add(refreshData);
  res.send({
    statusCode: 200,
  });
};

export const refreshDataOf = async (integration: Integration) => {
  await saveChannelData(integration, undefined, false).catch((e: unknown) => {
    logger.error(`Error refreshing channel data for ${integration.id}. Error: ${JSON.stringify(e)}`);
  });
};

export const refreshData = async () => {
  logger.info('Refreshing all channel data');
  const integrations = await getAllConnectedIntegrations();

  for (const integration of integrations) {
    await refreshDataOf(integration);
  }
  logger.info('Refreshed all channel data');
};
