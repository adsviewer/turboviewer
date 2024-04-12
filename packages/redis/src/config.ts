import { z } from 'zod';
import { createEnv } from '@repo/utils';

const schema = z.object({
  REDIS_URL: z
    .string()
    .regex(/^"?redis(?:s|):\/\/.*:?.*:.*/)
    .default('redis://localhost:6379'),
});

export const env = createEnv(schema);
