import { IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { getAllSet, redisAddToSet, redisRemoveFromSet } from '@repo/redis';
import { FireAndForget, formatYYYMMDDDate, isAError } from '@repo/utils';
import {
  activeReportRedisKey,
  type AdAccountWithIntegration,
  adReportStatusToRedis,
  type ChannelInterface,
  getAdAccountWithIntegration,
  getDecryptedIntegration,
  JobStatusEnum,
  type ProcessReportReq,
  successExpirationSec,
} from '@repo/channel-utils';
import { Environment, MODE } from '@repo/mode';
import type { Request, Response } from 'express';
import { BatchClient, SubmitJobCommand } from '@aws-sdk/client-batch';
import { env } from './config';
import { getChannel } from './channel-helper';

const fireAndForget = new FireAndForget({ concurrency: 100 });

const batchClient = new BatchClient({ region: env.AWS_REGION });

const reportChannels = [IntegrationTypeEnum.TIKTOK, IntegrationTypeEnum.META];

const channelConcurrencyReportMap = new Map<IntegrationTypeEnum, number>([
  [IntegrationTypeEnum.TIKTOK, 2],
  [IntegrationTypeEnum.META, 5],
]);

export const AD_ACCOUNT_ID = 'AD_ACCOUNT_ID';
export const TASK_ID = 'TASK_ID';
export const CHANNEL_TYPE = 'CHANNEL_TYPE';
export const SINCE = 'SINCE';
export const UNTIL = 'UNTIL';

export const checkReports = async (): Promise<void> => {
  await Promise.all(
    reportChannels.map(async (channelType) => {
      const channel = getChannel(channelType);

      const reports = await getAllSet<ProcessReportReq>(activeReportRedisKey(channelType));
      const processingReports = reports.filter((report) => report.status === JobStatusEnum.PROCESSING);
      const updatedProcessingReports = await Promise.all(updateReports(processingReports, channel, channelType));

      const queuedReports = reports.filter((report) => report.status === JobStatusEnum.QUEUING);
      const availableReportsToStart =
        channelConcurrencyReportMap.get(channelType) ?? 0 - updatedProcessingReports.length;
      if (availableReportsToStart <= 0) return;

      const reportsToStart = queuedReports.slice(0, availableReportsToStart);
      await runAsyncReports(channelType, reportsToStart, channel);
    }),
  );
};

export const channelDataReportWebhook = (_req: Request, res: Response): void => {
  fireAndForget.add(() => checkReports());
  res.send({
    statusCode: 200,
  });
};

const updateReports = (
  processingReports: ProcessReportReq[],
  channel: ChannelInterface,
  channelType: 'TIKTOK' | 'META',
): Promise<ProcessReportReq>[] =>
  processingReports.map(async (report) => {
    const adAccount = await getAdAccountWithIntegration(report.adAccountId);
    if (isAError(adAccount)) throw new Error(adAccount.message);
    if (!('taskId' in report) || !report.taskId) throw new Error('TaskId is missing');

    const status = await channel.getReportStatus(adAccount, report.taskId);
    logger.info(`Task ${report.taskId} status: ${String(status)}`);
    switch (status) {
      case JobStatusEnum.SUCCESS:
        if (report.status === JobStatusEnum.PROCESSING) {
          logger.info(`Should remove report: ${JSON.stringify(report)}`);
          const removed = await redisRemoveFromSet(activeReportRedisKey(channelType), report);
          logger.info(`Removed ${String(removed)} items.`);
          report.status = JobStatusEnum.SUCCESS;
          logger.info(`Adding report: ${JSON.stringify({ ...report })}`);
          await redisAddToSet(
            activeReportRedisKey(channelType),
            { ...report } satisfies ProcessReportReq,
            successExpirationSec,
          );
          await processReport(adAccount, report, channelType, channel);
        }
        break;
      case JobStatusEnum.FAILED:
      case JobStatusEnum.CANCELED:
        logger.error(`Report ${JSON.stringify(report)} was canceled/failed`);
        await redisRemoveFromSet(activeReportRedisKey(channelType), report);
        break;
      default:
        break;
    }
    return report;
  });

const runAsyncReports = async (
  channelType: IntegrationTypeEnum,
  reports: ProcessReportReq[],
  channel: ChannelInterface,
): Promise<void> => {
  const adAccounts = await prisma.adAccount.findMany({
    where: { id: { in: reports.map((report) => report.adAccountId) } },
  });
  const adAccountIdAdAccountMap = new Map(adAccounts.map((account) => [account.id, account]));
  // eslint-disable-next-line @typescript-eslint/no-floating-promises -- we want to run all the reports in parallel
  await Promise.all(
    reports.map(async (report) => {
      const account = adAccountIdAdAccountMap.get(report.adAccountId);
      if (!account) throw new Error('AdAccount is missing');
      const integration = await getDecryptedIntegration(account.integrationId);
      if (isAError(integration)) throw new Error(integration.message);
      return {
        taskId: await channel.runAdInsightReport(account, integration, new Date(report.since), new Date(report.until)),
        since: report.since,
        until: report.until,
        adAccountId: account.id,
      };
    }),
  ).then((taskIds) =>
    taskIds.map(({ taskId, adAccountId, since, until }) => {
      if (isAError(taskId)) return;
      return adReportStatusToRedis(channelType, adAccountId, since, until, JobStatusEnum.PROCESSING, taskId);
    }),
  );
};

const processReport = async (
  adAccount: AdAccountWithIntegration,
  activeReport: ProcessReportReq,
  channelType: IntegrationTypeEnum,
  channel: ChannelInterface,
): Promise<void> => {
  if (!('taskId' in activeReport) || !activeReport.taskId) throw new Error('TaskId is missing');
  const since = new Date(activeReport.since);
  const until = new Date(activeReport.until);
  if (MODE !== Environment.Local) {
    await batchClient.send(
      new SubmitJobCommand({
        jobDefinition: process.env.CHANNEL_PROCESS_REPORT_JOB_DEFINITION,
        jobQueue: process.env.CHANNEL_PROCESS_REPORT_JOB_QUEUE,
        containerOverrides: {
          environment: [
            { name: AD_ACCOUNT_ID, value: adAccount.id },
            { name: TASK_ID, value: activeReport.taskId },
            { name: CHANNEL_TYPE, value: channelType },
            { name: SINCE, value: since.toISOString() },
            { name: UNTIL, value: until.toISOString() },
          ],
        },
        jobName: `processReport-${channelType}-${activeReport.taskId}-${adAccount.id}-${formatYYYMMDDDate(since)}-${formatYYYMMDDDate(until)}`,
      }),
    );
  } else {
    await channel.processReport(
      adAccount,
      activeReport.taskId,
      new Date(activeReport.since),
      new Date(activeReport.until),
    );
  }
};

const periodicCheckReports = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- it's fine
  setTimeout(async () => {
    await checkReports().catch((e: unknown) => {
      logger.error(e);
    });
    periodicCheckReports();
  }, 10_000);
};
if (MODE === Environment.Local) periodicCheckReports();
