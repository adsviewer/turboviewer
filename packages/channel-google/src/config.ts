import { z } from 'zod';
import { apiEndpointSchema, createEnv } from '@repo/utils';
import { channelsSchema } from '@repo/channel-utils';

const schema = z
  .object({
    GOOGLE_CHANNEL_APPLICATION_ID: z.string(),
    GOOGLE_CHANNEL_APPLICATION_SECRET: z.string(),
    GOOGLE_CHANNEL_DEVELOPER_TOKEN: z.string(),
    GOOGLE_CHANNEL_REFRESH_TOKEN: z.string(),
  })
  .merge(apiEndpointSchema)
  .merge(channelsSchema);

export const env = createEnv(schema);
