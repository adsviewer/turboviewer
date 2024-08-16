import 'dotenv/config';
import { logger } from '@repo/logger';
import { getAdAccountWithIntegration, getChannel } from '@repo/channel';
import { isAError } from '@repo/utils';
import { env } from './config';

export const processReport = async (): Promise<void> => {
  logger.info(
    `Processing report for ${env.CHANNEL_TYPE}, task ${env.TASK_ID}, ad account ${env.AD_ACCOUNT_ID}, initial ${String(env.INITIAL)}`,
  );

  const channel = getChannel(env.CHANNEL_TYPE);
  const adAccount = await getAdAccountWithIntegration(env.AD_ACCOUNT_ID);
  if (isAError(adAccount)) {
    logger.error(adAccount);
    return;
  }
  await channel.processReport(adAccount, env.TASK_ID, env.INITIAL);
};

void processReport();
