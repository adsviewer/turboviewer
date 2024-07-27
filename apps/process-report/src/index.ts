import { type Context, type SQSEvent } from 'aws-lambda';
import { lambdaRequestTracker, logger } from '@repo/logger';
import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MODE } from '@repo/mode';

const withRequest = lambdaRequestTracker();

Sentry.init({
  dsn: 'https://fcb186d343920e1c2be891a1ee177864@o4507502891040768.ingest.de.sentry.io/4507661013614672',
  environment: MODE,
  integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

// eslint-disable-next-line @typescript-eslint/require-await -- Lambda handler must be async
export const handler = Sentry.wrapHandler(async (event: SQSEvent, context: Context): Promise<string> => {
  withRequest(event, context);
  logger.info(event);

  throw new Error('Not implemented');
});
