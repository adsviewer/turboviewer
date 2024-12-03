import { z } from 'zod';
import { apiEndpointSchema, createEnv } from '@repo/utils';
import { channelsSchema } from '@repo/channel-utils';

const schema = z
  .object({
    REDDIT_CLIENT_ID: z.string(),
    REDDIT_CLIENT_SECRET: z.string(),
  })
  .merge(apiEndpointSchema)
  .merge(channelsSchema);

export const env = createEnv(schema);
