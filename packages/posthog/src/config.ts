import { z } from 'zod';
import { createEnv } from '@repo/utils';

const schema = z.object({
  POSTHOG_API_KEY: z.string(),
});

export const env = createEnv(schema);
