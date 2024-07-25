import { type Context, type Handler } from 'aws-lambda';
import { lambdaRequestTracker, logger } from '@repo/logger';
import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MODE } from '@repo/mode';
import {
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
  type ReceiveMessageResult,
  SQSClient,
} from '@aws-sdk/client-sqs';

const withRequest = lambdaRequestTracker();

const client = new SQSClient({});

const receiveMessage = (): Promise<ReceiveMessageResult> =>
  client.send(
    new ReceiveMessageCommand({
      MessageSystemAttributeNames: ['All'],
      MaxNumberOfMessages: 10,
      MessageAttributeNames: ['All'],
      QueueUrl: process.env.TIKTOK_REPORT_REQUESTS_QUEUE,
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

export const handler = Sentry.wrapHandler(async (event: Handler, context: Context): Promise<string> => {
  withRequest(event, context);
  logger.info(event);

  const { Messages } = await receiveMessage();

  if (!Messages) {
    logger.info('No message in queue');
    return 'No message in queue';
  }

  if (Messages.length === 1) {
    logger.info(Messages[0].Body, 'Deleting message');
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: process.env.TIKTOK_REPORT_REQUESTS_QUEUE,
        ReceiptHandle: Messages[0].ReceiptHandle,
      }),
    );
    logger.info('Message deleted');
    return 'Message deleted';
  }

  logger.info(Messages, 'Deleting messages');
  await client.send(
    new DeleteMessageBatchCommand({
      QueueUrl: process.env.TIKTOK_REPORT_REQUESTS_QUEUE,
      Entries: Messages.map((message) => ({
        Id: message.MessageId,
        ReceiptHandle: message.ReceiptHandle,
      })),
    }),
  );
  logger.info('Messages deleted');
  return 'Messages deleted';
});
