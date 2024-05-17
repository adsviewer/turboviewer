import { type Context, type Handler } from 'aws-lambda';
import { refreshData } from '@repo/channel';
import { type z } from 'zod';
import { lambdaRequestTracker, logger } from '@repo/logger';
import { channelIngressInput, type channelIngressOutput } from '@repo/lambda-types';

const withRequest = lambdaRequestTracker();

export const handler = async (event: Handler, context: Context): Promise<z.infer<typeof channelIngressOutput>> => {
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
};
