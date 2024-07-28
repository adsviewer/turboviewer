import { IntegrationTypeEnum } from '@repo/database';
import { logger } from '@repo/logger';
import {
  DeleteMessageCommand,
  type Message,
  ReceiveMessageCommand,
  type ReceiveMessageResult,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { redisGet, redisSet } from '@repo/redis';
import { isAError } from '@repo/utils';
import { Environment, MODE } from '@repo/mode';
import {
  JobStatusEnum,
  type ProcessReportReq,
  reportRequestsQueueUrl,
  type RunAdInsightReportReq,
} from '@repo/channel-utils';
import { env } from './config';
import { getChannel } from './channel-helper';

const client = new SQSClient({ region: env.AWS_REGION });

const reportChannels = [IntegrationTypeEnum.TIKTOK];

const receiveMessage = (channel: IntegrationTypeEnum): Promise<ReceiveMessageResult> =>
  client.send(
    new ReceiveMessageCommand({
      MaxNumberOfMessages: 1,
      QueueUrl: reportRequestsQueueUrl(channel),
      WaitTimeSeconds: 20,
      VisibilityTimeout: 20,
    }),
  );

const activeReportRedisKey = (channel: IntegrationTypeEnum): string => `active-report:${String(channel)}`;

const _channelConcurrencyReportMap = new Map<IntegrationTypeEnum, number>([
  [IntegrationTypeEnum.TIKTOK, 1],
  [IntegrationTypeEnum.META, 10],
]);

async function deleteMessage(msg: Message, channel: IntegrationTypeEnum): Promise<void> {
  if (msg.ReceiptHandle) {
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: reportRequestsQueueUrl(channel),
        ReceiptHandle: msg.ReceiptHandle,
      }),
    );
    logger.info('Message deleted');
  }
}

const checkReports = async (): Promise<void> => {
  for (const channelType of reportChannels) {
    const channel = getChannel(channelType);
    const { Messages } = await receiveMessage(channelType);

    if (!Messages) {
      logger.info('No message in queue');
      continue;
    }
    const body = Messages[0].Body;
    if (!body) {
      logger.warn('Empty message');
      continue;
    }

    const parsed = JSON.parse(body) as RunAdInsightReportReq;

    const activeReport = await redisGet<ProcessReportReq>(activeReportRedisKey(channelType));

    if (!activeReport) {
      logger.info('No active report');
      const taskId = await channel.runAdInsightReport(parsed);
      if (isAError(taskId)) {
        logger.error(taskId);
        continue;
      }
      await redisSet(activeReportRedisKey(channelType), { ...parsed, taskId } satisfies ProcessReportReq, 60 * 60 * 24);
    } else {
      logger.info('Active report');
      const status = await channel.getReportStatus(activeReport);
      logger.info(`Task ${activeReport.taskId} status: ${String(status)}`);
      switch (status) {
        case JobStatusEnum.SUCCESS:
          await Promise.all([channel.processReport(activeReport), deleteMessage(Messages[0], channelType)]);
          await deleteMessage(Messages[0], channelType);
          continue;
        case JobStatusEnum.FAILED:
        case JobStatusEnum.CANCELED:
          logger.error(`Task ${activeReport.taskId} was canceled/failed`);
          await deleteMessage(Messages[0], channelType);
          continue;
        default:
          break;
      }
    }
  }
};

const periodicCheckReports = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- it's fine
  setTimeout(async () => {
    logger.info('Checking reports');
    await checkReports();
    logger.info('Reports checked');
    periodicCheckReports();
  }, 5000);
};
if (MODE === Environment.Local) periodicCheckReports();
