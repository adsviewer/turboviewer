import { z } from 'zod';

export const commonSchema = z.object({
  AUTH_SECRET: z.string().min(1).default('something'),
  REFRESH_SECRET: z.string().min(1).default('refreshSecret'),
});

export const TOKEN_KEY = 'av_token';
export const REFRESH_TOKEN_KEY = 'av_refresh_token';
