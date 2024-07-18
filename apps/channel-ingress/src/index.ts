import { type Context, type Handler } from 'aws-lambda';
import { refreshData } from '@repo/channel';
import { type z } from 'zod';
import { lambdaRequestTracker, logger } from '@repo/logger';
import { channelIngressInput, type channelIngressOutput } from '@repo/lambda-types';
import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Environment } from '@repo/utils';

const withRequest = lambdaRequestTracker();

Sentry.init({
  dsn: 'https://eb2db6b43bd267b81d7165fc7a052bab@o4507502891040768.ingest.de.sentry.io/4507509016100944',
  environment: Environment.Production,
  integrations: [nodeProfilingIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

export const handler = Sentry.wrapHandler(
  async (event: Handler, context: Context): Promise<z.infer<typeof channelIngressOutput>> => {
    withRequest(event, context);
    logger.info(event);

    const parsedEvent = channelIngressInput.safeParse(event);
    if (!parsedEvent.success) {
      logger.error(parsedEvent.error);
      return {
        statusCode: 400,
        body: 'Bad request',
      };
    }
    const body = parsedEvent.data;
    return await refreshData(body);
  },
);
