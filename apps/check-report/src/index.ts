import { type Context, type Handler } from 'aws-lambda';
import { lambdaRequestTracker, logger } from '@repo/logger';
import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MODE } from '@repo/mode';

const withRequest = lambdaRequestTracker();

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

  return Promise.resolve('Done');
});
