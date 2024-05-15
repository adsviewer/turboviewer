import { z } from 'zod';

export const commonSchema = z.object({
  AUTH_SECRET: z.string().min(1).default('something'),
  REFRESH_SECRET: z.string().min(1).default('refreshSecret'),
});
