import { z } from 'zod';
import { createEnv } from '@repo/utils';
import { channelsSchema } from '@repo/channel-utils';

const schema = z
  .object({
    FB_APPLICATION_ID: z.string().min(15).max(17),
    FB_APPLICATION_SECRET: z.string().length(32),
  })
  .merge(channelsSchema);

export const env = createEnv(schema);
