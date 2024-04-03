import { z } from 'zod';
import { createEnv } from './env-helper';

export const commonSchema = z.object({
  AUTH_SECRET: z.string().min(1).default('something'),
  REFRESH_SECRET: z.string().min(1).default('refreshSecret'),
});

export const env = createEnv(commonSchema);
