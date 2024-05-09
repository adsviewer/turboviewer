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

export const refreshDataOf = async (integration: Integration, initial: boolean) => {
  await saveChannelData(integration, undefined, initial).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    logger.error(`Error refreshing channel data for ${integration.id}. Error: ${msg}`);
  });
};

export const refreshData = async (initial?: boolean) => {
  logger.info('Refreshing all channel data');
  const integrations = await getAllConnectedIntegrations();

  for (const integration of integrations) {
    await refreshDataOf(integration, Boolean(initial));
  }
  logger.info('Refreshed all channel data');
};
