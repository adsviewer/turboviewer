import 'dotenv/config';
import { logger } from '@repo/logger';
import { getAdAccountWithIntegration, getChannel } from '@repo/channel';
import { isAError } from '@repo/utils';
import { prisma } from '@repo/database';
import { env } from './config';

export const processReport = async (): Promise<void> => {
  logger.info(
    `Processing report for ${env.CHANNEL_TYPE}, task ${env.TASK_ID}, ad account ${env.AD_ACCOUNT_ID}, since ${env.SINCE.toISOString()}, until ${env.UNTIL.toISOString()}`,
  );

  const channel = getChannel(env.CHANNEL_TYPE);
  const adAccount = await getAdAccountWithIntegration(env.AD_ACCOUNT_ID);
  if (isAError(adAccount)) {
    logger.error(adAccount);
    return;
  }
  const report = await channel.processReport(adAccount, env.TASK_ID, env.SINCE, env.UNTIL);
  logger.info(
    `Report processed ${isAError(report) ? 'un' : ''}successfully for ${env.CHANNEL_TYPE}, task ${env.TASK_ID}, ad account ${env.AD_ACCOUNT_ID}, since ${env.SINCE.toISOString()}, until ${env.UNTIL.toISOString()}`,
  );
  await prisma.integration.update({ where: { id: adAccount.integrationId }, data: { lastSyncedAt: new Date() } });
  process.exit(0);
};

await processReport();
