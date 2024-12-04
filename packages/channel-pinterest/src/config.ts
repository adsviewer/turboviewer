import { z } from 'zod';
import { apiEndpointSchema, createEnv } from '@repo/utils';

const schema = z
  .object({
    PINTEREST_APP_ID: z.string(),
    PINTEREST_APP_SECRET: z.string(),
  })
  .merge(apiEndpointSchema);

export const env = createEnv(schema);
