import { z } from 'zod';
import { createEnv } from '@repo/utils';
import { channelsSchema } from '@repo/channel-utils';

const schema = z
  .object({
    TIKTOK_APPLICATION_ID: z.string().length(19),
    TIKTOK_APPLICATION_SECRET: z.string().length(40),
  })
  .merge(channelsSchema);

export const env = createEnv(schema);
