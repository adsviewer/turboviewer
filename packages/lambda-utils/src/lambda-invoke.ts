import { AError } from '@repo/utils';
import { logger } from '@repo/logger';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { MODE } from '@repo/mode';
import { z, type ZodRawShape } from 'zod';
import { env } from './config';

export const channelIngressInput = z.object({
  initial: z.boolean(),
  integrationIds: z.array(z.string()).optional(),
});

export const channelIngressOutput = z.object({
  statusCode: z.number().int(),
  body: z.string(),
});

export const lambdaInvoke = async <T, U extends ZodRawShape>(
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
    logger.error(parsed.error, 'Error parsing response');
    return new AError('Error parsing response');
  }
  return parsed.data;
};

export const invokeChannelIngressLambda = async (
  payload: z.infer<typeof channelIngressInput>,
): Promise<z.infer<typeof channelIngressOutput> | AError> =>
  lambdaInvoke(`${MODE}-channel-ingress`, payload, channelIngressOutput);
