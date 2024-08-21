import { type AdAccount, type IntegrationTypeEnum } from '@repo/database';
import { redisAddToSet, redisRemoveFromSet } from '@repo/redis';
import { logger } from '@repo/logger';
import { timeRanges } from './date-utils';

export interface ProcessReportReq {
  since: Date | string;
  until: Date | string;
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
    adAccounts.map(async (account) => {
      const ranges = await timeRanges(initial, account.id);
      await Promise.all(
        ranges.map((range) =>
          adReportStatusToRedis(channelType, account.id, range.since, range.until, JobStatusEnum.QUEUING),
        ),
      );
    }),
  );
};

export const adReportStatusToRedis = async (
  channelType: IntegrationTypeEnum,
  adAccountId: string,
  since: Date | string,
  until: Date | string,
  status: JobStatusEnum,
  taskId?: string,
): Promise<void> => {
  if (status !== JobStatusEnum.QUEUING) {
    logger.info(
      `Should remove adAccountId: ${adAccountId}, status: ${status}, since: ${String(since)}, until: ${String(until)}`,
    );
    const removed = await redisRemoveFromSet(activeReportRedisKey(channelType), {
      since,
      until,
      adAccountId,
      status: JobStatusEnum.QUEUING,
    } satisfies ProcessReportReq);
    logger.info(`Removed ${String(removed)} items.`);
  }
  logger.info(`Adding adAccountId: ${adAccountId}, status: ${status}, taskId: ${String(taskId)}`);
  await redisAddToSet(
    activeReportRedisKey(channelType),
    { since, until, adAccountId, taskId, status } satisfies ProcessReportReq,
    maxTimeToProcessSec,
  );
};
