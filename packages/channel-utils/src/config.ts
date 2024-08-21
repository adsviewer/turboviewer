import { z } from 'zod';
import { createEnv } from '@repo/utils';

export const channelsSchema = z.object({
  CHANNEL_SECRET: z.string().min(1).default('channelSecret'),
});

export const env = createEnv(channelsSchema);
