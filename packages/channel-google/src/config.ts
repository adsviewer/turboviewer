import { z } from 'zod';
import { apiEndpointSchema, createEnv } from '@repo/utils';

const schema = z
  .object({
    GOOGLE_CHANNEL_APPLICATION_ID: z.string(),
    GOOGLE_CHANNEL_APPLICATION_SECRET: z.string(),
    GOOGLE_CHANNEL_DEVELOPER_TOKEN: z.string(),
  })
  .merge(apiEndpointSchema);

export const env = createEnv(schema);
