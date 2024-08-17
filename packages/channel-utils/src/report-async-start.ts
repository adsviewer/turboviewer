import { type AdAccount, type IntegrationTypeEnum } from '@repo/database';
import { redisAddToSet, redisRemoveFromSet } from '@repo/redis';
import { logger } from '@repo/logger';

export interface ProcessReportReq {
  initial: boolean;
  adAccountId: string;
  taskId?: string;
  status: JobStatusEnum;
}

export enum JobStatusEnum {
  QUEUING = 'QUEUING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export const activeReportRedisKey = (channel: IntegrationTypeEnum): string => `active-report:${String(channel)}`;
export const maxTimeToProcessSec = 60 * 60 * 6;
export const successExpirationSec = 60 * 5;

export const adReportsStatusesToRedis = async (
  channelType: IntegrationTypeEnum,
  adAccounts: AdAccount[],
  initial: boolean,
): Promise<void> => {
  await Promise.all(
    adAccounts.map(async (account) => adReportStatusToRedis(channelType, account.id, initial, JobStatusEnum.QUEUING)),
  );
};

export const adReportStatusToRedis = async (
  channelType: IntegrationTypeEnum,
  adAccountId: string,
  initial: boolean,
  status: JobStatusEnum,
  taskId?: string,
): Promise<void> => {
  if (status !== JobStatusEnum.QUEUING) {
    logger.info(`Should remove adAccountId: ${adAccountId}, status: ${status}, initial: ${String(initial)}`);
    const removed = await redisRemoveFromSet(activeReportRedisKey(channelType), {
      initial,
      adAccountId,
      status: JobStatusEnum.QUEUING,
    } satisfies ProcessReportReq);
    logger.info(`Removed ${String(removed)} items.`);
  }
  logger.info(`Adding adAccountId: ${adAccountId}, status: ${status}, taskId: ${String(taskId)}`);
  await redisAddToSet(
    activeReportRedisKey(channelType),
    { initial, adAccountId, taskId, status } satisfies ProcessReportReq,
    maxTimeToProcessSec,
  );
};
