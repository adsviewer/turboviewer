import { z } from 'zod';
import { createEnv } from '@repo/utils';
import { channelsSchema } from '@repo/channel-utils';

const schema = z
  .object({
    PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  })
  .merge(channelsSchema);

export const env = createEnv(schema);
