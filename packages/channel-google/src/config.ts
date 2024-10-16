import { z } from 'zod';
import { apiEndpointSchema, createEnv } from '@repo/utils';
import { channelsSchema } from '@repo/channel-utils';

const schema = z
  .object({
    GOOGLE_APPLICATION_ID: z.string(),
    GOOGLE_APPLICATION_SECRET: z.string(),
  })
  .merge(apiEndpointSchema)
  .merge(channelsSchema);

export const env = createEnv(schema);
