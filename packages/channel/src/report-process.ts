import { type AdAccount, IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { getAllSet, redisAddToSet, redisRemoveFromSet } from '@repo/redis';
import { FireAndForget, isAError } from '@repo/utils';
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
  [IntegrationTypeEnum.TIKTOK, 5],
  [IntegrationTypeEnum.META, 5],
]);

export const AD_ACCOUNT_ID = 'AD_ACCOUNT_ID';
export const TASK_ID = 'TASK_ID';
export const CHANNEL_TYPE = 'CHANNEL_TYPE';
export const INITIAL = 'INITIAL';

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
      const adAccountsToStart = await prisma.adAccount.findMany({
        where: { id: { in: reportsToStart.map((report) => report.adAccountId) } },
      });
      await runAsyncReports(channelType, adAccountsToStart, channel, false);
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
        logger.error(`Task ${report.taskId} was canceled/failed`);
        await redisRemoveFromSet(activeReportRedisKey(channelType), report);
        break;
      default:
        break;
    }
    return report;
  });

const runAsyncReports = async (
  channelType: IntegrationTypeEnum,
  adAccounts: AdAccount[],
  channel: ChannelInterface,
  initial: boolean,
): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises -- we want to run all the reports in parallel
  await Promise.all(
    adAccounts.map(async (account) => {
      const integration = await getDecryptedIntegration(account.integrationId);
      if (isAError(integration)) throw new Error(integration.message);
      return {
        taskId: await channel.runAdInsightReport(account, integration, initial),
        adAccountId: account.id,
      };
    }),
  ).then((taskIds) =>
    taskIds.map(({ taskId, adAccountId }) => {
      if (isAError(taskId)) return;
      return adReportStatusToRedis(channelType, adAccountId, initial, JobStatusEnum.PROCESSING, taskId);
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
            { name: INITIAL, value: String(activeReport.initial) },
          ],
        },
        jobName: `processReport-${channelType}-${activeReport.taskId}-${adAccount.id}-${String(activeReport.initial)}`,
      }),
    );
  } else {
    await channel.processReport(adAccount, activeReport.taskId, activeReport.initial);
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
