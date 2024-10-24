import { type Context, type Handler } from 'aws-lambda';
import { cacheSummaryTopAds } from '@repo/channel';
import * as Sentry from '@sentry/aws-serverless';
import { lambdaRequestTracker } from '@repo/logger';
import { MODE } from '@repo/mode';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const withRequest = lambdaRequestTracker();

Sentry.init({
  dsn: 'https://2e02572d33a02b69733ee64a0279cb60@o4507502891040768.ingest.de.sentry.io/4508177256284240',
  environment: MODE,
  integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

export const handler = Sentry.wrapHandler(async (event: Handler, context: Context): Promise<void> => {
  withRequest(event, context);
  await cacheSummaryTopAds();
});
