import { z } from 'zod';
import { createEnv } from '@repo/utils';

const schema = z.object({
  DATABASE_URL: z
    .string()
    .regex(/^"?postgres(?:ql|):\/\/.*:?.*?@.*(?::.*)?\/.*/)
    .default('postgresql://postgres@localhost:5432/adsviewer'),
  DATABASE_RO_URL: z
    .string()
    .regex(/^"?postgres(?:ql|):\/\/.*:?.*?@.*(?::.*)?\/.*/)
    .optional(),
});

export const env = createEnv(schema);
