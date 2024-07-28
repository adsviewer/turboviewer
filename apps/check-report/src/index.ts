import { type Context, type Handler } from 'aws-lambda';
import { lambdaRequestTracker, logger } from '@repo/logger';
import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MODE } from '@repo/mode';
import {
  DeleteMessageCommand,
  type Message,
  ReceiveMessageCommand,
  type ReceiveMessageResult,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { redisGet, redisSet } from '@repo/redis';
import { Tiktok } from '@repo/channel-tiktok';
import { isAError } from '@repo/utils';
import { IntegrationTypeEnum } from '@repo/database';
import {
  JobStatusEnum,
  type RedisReportRequest,
  type ReportRequestInput,
  reportRequestsQueueUrl,
} from '@repo/lambda-types';
import { env } from './config';

const reportChannels = [IntegrationTypeEnum.TIKTOK];

const withRequest = lambdaRequestTracker();

const client = new SQSClient({ region: env.AWS_REGION });

const _channelConcurrencyReportMap = new Map<IntegrationTypeEnum, number>([
  [IntegrationTypeEnum.TIKTOK, 1],
  [IntegrationTypeEnum.META, 10],
]);

const receiveMessage = (channel: IntegrationTypeEnum): Promise<ReceiveMessageResult> =>
  client.send(
    new ReceiveMessageCommand({
      MaxNumberOfMessages: 1,
      QueueUrl: reportRequestsQueueUrl(channel),
      WaitTimeSeconds: 20,
      VisibilityTimeout: 20,
    }),
  );

Sentry.init({
  dsn: 'https://37eb719907cfb78977edc3f2379987b9@o4507502891040768.ingest.de.sentry.io/4507661011189840',
  environment: MODE,
  integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

async function deleteMessage(msg: Message, channel: IntegrationTypeEnum): Promise<void> {
  if (!msg.ReceiptHandle) {
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: reportRequestsQueueUrl(channel),
        ReceiptHandle: msg.ReceiptHandle,
      }),
    );
    logger.info('Message deleted');
  }
}

const activeReportRedisKey = (channel: IntegrationTypeEnum): string => `active-report:${String(channel)}`;

export const handler = Sentry.wrapHandler(async (event: Handler, context: Context): Promise<string> => {
  withRequest(event, context);
  logger.info(event);

  for (const channel of reportChannels) {
    const { Messages } = await receiveMessage(channel);

    if (!Messages) {
      logger.warn('No message in queue');
      continue;
    }
    const body = Messages[0].Body;
    if (!body) {
      logger.warn('Empty message');
      continue;
    }

    const parsed = JSON.parse(body) as ReportRequestInput;

    const activeReport = await redisGet<RedisReportRequest>(activeReportRedisKey(channel));

    if (!activeReport) {
      logger.info('No active report');
      const taskId = await Tiktok.runAdInsightReport(parsed);
      if (isAError(taskId)) {
        logger.error(taskId);
        continue;
      }
      await redisSet(activeReportRedisKey(channel), { ...parsed, taskId } satisfies RedisReportRequest, 60 * 60 * 24);
      await deleteMessage(Messages[0], channel);
    } else {
      logger.info('Active report');
      const status = await Tiktok.getProcessStatus(activeReport);
      logger.info(`Task ${activeReport.taskId} status: ${String(status)}`);
      switch (status) {
        case JobStatusEnum.SUCCESS:
          await Promise.all([Tiktok.processReport(activeReport), deleteMessage(Messages[0], channel)]);
          continue;
        case JobStatusEnum.FAILED:
        case JobStatusEnum.CANCELED:
          logger.error(`Task ${activeReport.taskId} was canceled/failed`);
          await deleteMessage(Messages[0], channel);
          continue;
        default:
          break;
      }
    }
  }

  return 'Done';
});
