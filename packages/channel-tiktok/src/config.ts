import { z } from 'zod';
import { createEnv } from '@repo/utils';
import { channelsSchema } from '@repo/channel-utils';

const schema = z
  .object({
    TIKTOK_APPLICATION_ID: z.string().length(19),
    TIKTOK_APPLICATION_SECRET: z.string().length(40),
    TIKTOK_REPORT_REQUESTS_QUEUE_URL: z.string().url(),
  })
  .merge(channelsSchema);

export const env = createEnv(schema);
