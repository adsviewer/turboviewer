import { IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { getAllSet, redisAddToSet, redisRemoveFromSet } from '@repo/redis';
import { formatYYYMMDDDate, isAError } from '@repo/utils';
import {
  activeReportRedisKey,
  type AdAccountIntegration,
  adReportStatusToRedis,
  type ChannelInterface,
  getAdAccountsWithIntegration,
  getAdAccountWithIntegration,
  JobStatusEnum,
  type ProcessReportReq,
  successExpirationSec,
} from '@repo/channel-utils';
import { Environment, MODE } from '@repo/mode';
import { BatchClient, SubmitJobCommand } from '@aws-sdk/client-batch';
import { env } from './config';
import { getChannel } from './channel-helper';

const batchClient = new BatchClient({ region: env.AWS_REGION });

export const asyncReportChannels = [IntegrationTypeEnum.TIKTOK, IntegrationTypeEnum.META];

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
    asyncReportChannels.map(async (channelType) => {
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

const updateReports = (
  processingReports: ProcessReportReq[],
  channel: ChannelInterface,
  channelType: 'TIKTOK' | 'META',
): Promise<ProcessReportReq>[] =>
  processingReports.map(async (report) => {
    const adAccountIntegration = await getAdAccountWithIntegration(report.adAccountId);
    if (isAError(adAccountIntegration)) throw new Error(adAccountIntegration.message);
    if (!('taskId' in report) || !report.taskId) throw new Error('TaskId is missing');

    const status = await channel.getReportStatus(adAccountIntegration, report.taskId);
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
          await processReport(adAccountIntegration, report, channelType, channel);
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
  const adAccountsIntegrations = await getAdAccountsWithIntegration(reports.map((report) => report.adAccountId));
  const adAccountIdAdAccountMap = new Map(adAccountsIntegrations.map((ai) => [ai.adAccount.id, ai]));
  // eslint-disable-next-line @typescript-eslint/no-floating-promises -- we want to run all the reports in parallel
  await Promise.all(
    reports.map(async (report) => {
      const accountIntegration = adAccountIdAdAccountMap.get(report.adAccountId);
      if (!accountIntegration) throw new Error('AdAccount is missing');
      return {
        taskId: await channel.runAdInsightReport(
          accountIntegration.adAccount,
          accountIntegration.integration,
          new Date(report.since),
          new Date(report.until),
        ),
        since: report.since,
        until: report.until,
        adAccountId: accountIntegration.adAccount.id,
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
  accountIntegration: AdAccountIntegration,
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
            { name: AD_ACCOUNT_ID, value: accountIntegration.adAccount.id },
            { name: TASK_ID, value: activeReport.taskId },
            { name: CHANNEL_TYPE, value: channelType },
            { name: SINCE, value: since.toISOString() },
            { name: UNTIL, value: until.toISOString() },
          ],
        },
        jobName: `processReport-${channelType}-${activeReport.taskId}-${accountIntegration.adAccount.id}-${formatYYYMMDDDate(since)}-${formatYYYMMDDDate(until)}`,
      }),
    );
  } else {
    await channel.processReport(
      accountIntegration,
      activeReport.taskId,
      new Date(activeReport.since),
      new Date(activeReport.until),
    );
    await prisma.integration.update({
      where: { id: accountIntegration.integration.id },
      data: { lastSyncedAt: new Date() },
    });
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
