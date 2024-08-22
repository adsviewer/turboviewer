import { type Context, type Handler } from 'aws-lambda';
import { checkReports } from '@repo/channel';
import { type z } from 'zod';
import { lambdaRequestTracker } from '@repo/logger';
import { type channelIngressOutput } from '@repo/lambda-utils';
import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MODE } from '@repo/mode';

const withRequest = lambdaRequestTracker();

Sentry.init({
  dsn: 'https://a0c8969f0fd6169d2fc58aa8027595de@o4507502891040768.ingest.de.sentry.io/4507820281954384',
  environment: MODE,
  integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

export const handler = Sentry.wrapHandler(
  async (event: Handler, context: Context): Promise<z.infer<typeof channelIngressOutput>> => {
    withRequest(event, context);
    await checkReports();
    return {
      statusCode: 200,
      body: 'Success',
    };
  },
);
