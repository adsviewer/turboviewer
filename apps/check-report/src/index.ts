import { type Context, type Handler } from 'aws-lambda';
import { lambdaRequestTracker, logger } from '@repo/logger';
import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MODE } from '@repo/mode';
import { DeleteMessageCommand, ReceiveMessageCommand, type ReceiveMessageResult, SQSClient } from '@aws-sdk/client-sqs';
import { redisGet, redisSet } from '@repo/redis';
import { type z } from 'zod';
import { reportRequestInput, Tiktok } from '@repo/channel-tiktok';
import { isAError } from '@repo/utils';
import { type IntegrationTypeEnum } from '@repo/database';
import { env } from './config';

interface RedisReportRequest extends z.infer<typeof reportRequestInput> {
  taskId: string;
}

const withRequest = lambdaRequestTracker();

const client = new SQSClient({ region: env.AWS_REGION });

const receiveMessage = (): Promise<ReceiveMessageResult> =>
  client.send(
    new ReceiveMessageCommand({
      MaxNumberOfMessages: 10,
      QueueUrl: env.TIKTOK_REPORT_REQUESTS_QUEUE_URL,
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

async function deleteMessage(handle: string): Promise<void> {
  await client.send(
    new DeleteMessageCommand({
      QueueUrl: env.TIKTOK_REPORT_REQUESTS_QUEUE_URL,
      ReceiptHandle: handle,
    }),
  );
  logger.info('Message deleted');
}

export const handler = Sentry.wrapHandler(async (event: Handler, context: Context): Promise<string> => {
  withRequest(event, context);
  logger.info(event);

  const { Messages } = await receiveMessage();

  if (!Messages) {
    logger.warn('No message in queue');
    return 'No message in queue';
  }
  const body = Messages[0].Body;
  if (!body) {
    logger.warn('Empty message');
    return 'Empty message';
  }

  const parsed = reportRequestInput.safeParse(JSON.parse(body));
  if (!parsed.success) {
    logger.error(parsed.error);
    return `Error parsing message: ${parsed.error.message}`;
  }

  const activeReportRedisKey = (channel: IntegrationTypeEnum): string => `active-report:${String(channel)}`;
  const activeReport = await redisGet<RedisReportRequest>(activeReportRedisKey(parsed.data.channel));

  if (!activeReport) {
    logger.info('No active report');
    const taskId = await Tiktok.runAdInsightReport(parsed.data);
    if (isAError(taskId)) {
      logger.error(taskId);
      return taskId.message;
    }
    await redisSet(
      activeReportRedisKey(parsed.data.channel),
      { ...parsed.data, taskId } satisfies RedisReportRequest,
      60 * 60 * 24,
    );
    if (Messages[0].ReceiptHandle) await deleteMessage(Messages[0].ReceiptHandle);
    return 'No active report, started new report';
  }

  return 'Done';
});
