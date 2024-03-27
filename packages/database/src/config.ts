import { z } from 'zod';
import { createEnv } from '@repo/utils';

const schema = z.object({
  DATABASE_URL: z.string().regex(/^"?postgres(?:ql|):\/\/.*:.*?@.*:.*\/.*/),
});

export const env = createEnv(schema);
