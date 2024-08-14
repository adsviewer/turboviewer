import { IntegrationTypeEnum, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import {
  DeleteMessageCommand,
  type Message,
  ReceiveMessageCommand,
  type ReceiveMessageResult,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { getAllSet, redisAddToSet, redisRemoveFromSet } from '@repo/redis';
import { FireAndForget, isAError } from '@repo/utils';
import {
  adAccountWithIntegration,
  channelReportQueueUrl,
  decryptTokens,
  JobStatusEnum,
  type ProcessReportReq,
  runAdInsightReportReq,
} from '@repo/channel-utils';
import _ from 'lodash';
import { Environment, MODE } from '@repo/mode';
import type { Request, Response } from 'express';
import { env } from './config';
import { getChannel } from './channel-helper';

const fireAndForget = new FireAndForget({ concurrency: 100 });

const client = new SQSClient({ region: env.AWS_REGION });

const reportChannels = [IntegrationTypeEnum.TIKTOK, IntegrationTypeEnum.META];

const receiveMessage = (channel: IntegrationTypeEnum): Promise<ReceiveMessageResult> => {
  return client.send(
    new ReceiveMessageCommand({
      MaxNumberOfMessages: channelConcurrencyReportMap.get(channel),
      QueueUrl: channelReportQueueUrl(channel),
      WaitTimeSeconds: 20,
      VisibilityTimeout: 20,
    }),
  );
};

const activeReportRedisKey = (channel: IntegrationTypeEnum): string => `active-report:${String(channel)}`;

const channelConcurrencyReportMap = new Map<IntegrationTypeEnum, number>([
  [IntegrationTypeEnum.TIKTOK, 1],
  [IntegrationTypeEnum.META, 10],
]);

const deleteMessage = async (
  msg: Message,
  channel: IntegrationTypeEnum,
  redisValue: ProcessReportReq,
): Promise<void> => {
  if (msg.ReceiptHandle) {
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: channelReportQueueUrl(channel),
        ReceiptHandle: msg.ReceiptHandle,
      }),
    );
    logger.info('Message deleted');
  }
  await redisRemoveFromSet(activeReportRedisKey(channel), redisValue);
  redisValue.status = JobStatusEnum.SUCCESS;
  await redisAddToSet(activeReportRedisKey(channel), { ...redisValue } satisfies ProcessReportReq, 60 * 5);
};

export const checkReports = async (): Promise<void> => {
  await Promise.all(
    reportChannels.map(async (channelType) => {
      const channel = getChannel(channelType);
      const { Messages } = await receiveMessage(channelType);

      if (!Messages) {
        return;
      }

      const activeReports = await getAllSet<ProcessReportReq>(activeReportRedisKey(channelType));

      for (const msg of Messages) {
        const body = msg.Body;
        if (!body) {
          logger.warn('Empty message');
          continue;
        }
        const parsed = runAdInsightReportReq.safeParse(JSON.parse(body));
        if (!parsed.success) {
          logger.error(parsed.error);
          continue;
        }
        const { adAccountId, initial } = parsed.data;

        const adAccount = await prisma.adAccount.findUniqueOrThrow({
          where: { id: adAccountId },
          ...adAccountWithIntegration,
        });
        const integration = decryptTokens(adAccount.integration);
        if (!integration || isAError(integration)) continue;
        adAccount.integration = integration;

        const activeReport = activeReports.find((report) => _.isMatch(report, parsed.data));

        if (!activeReport) {
          logger.info(`No active report for ${adAccountId}`);
          const taskId = await channel.runAdInsightReport(adAccount, initial);
          if (isAError(taskId)) {
            logger.error(taskId);
            continue;
          }
          await redisAddToSet(
            activeReportRedisKey(channelType),
            { ...parsed.data, taskId, status: JobStatusEnum.QUEUING } satisfies ProcessReportReq,
            60 * 60 * 6,
          );
        } else {
          logger.info(`Active report for ${activeReport.adAccountId}`);
          const status = await channel.getReportStatus(adAccount, activeReport.taskId);
          logger.info(`Task ${activeReport.taskId} status: ${String(status)}`);
          switch (status) {
            case JobStatusEnum.SUCCESS:
              if (activeReport.status === JobStatusEnum.QUEUING) {
                await redisRemoveFromSet(activeReportRedisKey(channelType), activeReport);
                activeReport.status = JobStatusEnum.PROCESSING;
                await redisAddToSet(
                  activeReportRedisKey(channelType),
                  { ...activeReport } satisfies ProcessReportReq,
                  60 * 60 * 6,
                );
                // TODO: this should be invoking an aws batch
                fireAndForget.add(async () => {
                  const report = await channel.processReport(adAccount, activeReport.taskId, activeReport.initial);
                  if (!isAError(report)) {
                    await deleteMessage(msg, channelType, activeReport);
                  } else {
                    await redisRemoveFromSet(activeReportRedisKey(channelType), activeReport);
                  }
                });
              }
              continue;
            case JobStatusEnum.FAILED:
            case JobStatusEnum.CANCELED:
              logger.error(`Task ${activeReport.taskId} was canceled/failed`);
              await redisRemoveFromSet(activeReportRedisKey(channelType), activeReport);
              continue;
            default:
              break;
          }
        }
      }
    }),
  );
};

export const channelDataReportWebhook = (_req: Request, res: Response): void => {
  fireAndForget.add(() => checkReports());
  res.send({
    statusCode: 200,
  });
};

const periodicCheckReports = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- it's fine
  setTimeout(async () => {
    await checkReports().catch((e: unknown) => {
      logger.error(e);
    });
    periodicCheckReports();
  }, 1_000);
};
if (MODE === Environment.Local) periodicCheckReports();
