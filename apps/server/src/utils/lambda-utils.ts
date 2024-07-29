import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { type z, type ZodRawShape } from 'zod';
import { AError } from '@repo/utils';
import { type channelIngressInput, channelIngressOutput } from '@repo/lambda-types';
import { logger } from '@repo/logger';
import { getAllConnectedIntegrations, refreshData } from '@repo/channel';
import { Environment, MODE } from '@repo/mode';
import _ from 'lodash';
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
    logger.error(parsed.error, 'Error parsing response');
    return new AError('Error parsing response');
  }
  return parsed.data;
};

export const invokeChannelIngress = async (
  payload: z.infer<typeof channelIngressInput>,
): Promise<(AError | z.infer<typeof channelIngressOutput>)[] | z.infer<typeof channelIngressOutput> | AError> => {
  if (MODE === Environment.Local) {
    return await refreshData(payload);
  }
  const funcName = `${MODE}-channel-ingress`;
  if (payload.integrationIds) {
    return await invoke(funcName, payload, channelIngressOutput);
  }

  const connectedIntegrations = await getAllConnectedIntegrations();
  const slicedIntegrations = _.chunk(connectedIntegrations, 10);
  const results: (AError | z.infer<typeof channelIngressOutput>)[] = [];
  for (const integrations of slicedIntegrations) {
    const invocations = await Promise.all(
      integrations.map((integration) =>
        invoke(
          funcName,
          {
            initial: payload.initial,
            integrationIds: [integration.id],
          } satisfies z.infer<typeof channelIngressInput>,
          channelIngressOutput,
        ),
      ),
    );
    results.push(...invocations);
  }
  return results;
};
