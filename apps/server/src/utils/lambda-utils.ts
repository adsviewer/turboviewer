import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { type z, type ZodRawShape } from 'zod';
import { AError, Environment, MODE } from '@repo/utils';
import { type channelIngressInput, channelIngressOutput } from '@repo/lambda-types';
import { logger } from '@repo/logger';
import { refreshData } from '@repo/channel';
import { env } from '../config';

const invoke = async <T, U extends ZodRawShape>(
  funcName: string,
  payload: T,
  schema: z.ZodObject<U>,
): Promise<z.infer<typeof schema> | AError> => {
  const client = new LambdaClient({ region: env.AWS_REGION });
  const command = new InvokeCommand({
    FunctionName: funcName,
    Payload: JSON.stringify(payload),
  });

  const { Payload } = await client.send(command);
  if (!Payload) {
    const msg = 'No payload received';
    logger.error(msg);
    return new AError(msg);
  }
  const result = Buffer.from(Payload).toString();
  const parsed = schema.safeParse(JSON.parse(result));
  if (!parsed.success) {
    logger.error('Error parsing response', parsed.error);
    return new AError('Error parsing response', parsed.error);
  }
  return parsed.data;
};

export const invokeChannelIngress = async (
  payload: z.infer<typeof channelIngressInput>,
): Promise<z.infer<typeof channelIngressOutput> | AError> => {
  if (MODE === Environment.Local) {
    return await refreshData(payload);
  }
  return invoke(`${MODE}-channel-ingress`, payload, channelIngressOutput);
};
