import { z } from 'zod';
import { createEnv } from '@repo/utils';

const defaultPort = '4000';
export const channelsSchema = z.object({
  API_ENDPOINT: z.string().url().default(`http://localhost:${defaultPort}/api`),
  CHANNEL_SECRET: z.string().min(1).default('channelSecret'),
});

export const env = createEnv(channelsSchema);
