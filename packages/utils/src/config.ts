import { z } from 'zod';

export const commonSchema = z.object({
  AUTH_SECRET: z.string().min(1).default('something'),
  REFRESH_SECRET: z.string().min(1).default('refreshSecret'),
});

export const channelSchema = z.object({
  CHANNEL_SECRET: z.string().min(1).default('channelSecret'),
});

export const awsSchema = z.object({
  AWS_ACCOUNT_ID: z.string().length(12),
  AWS_REGION: z.string().default('eu-central-1'),
  AWS_USERNAME: z.string().optional(),
});

export const TOKEN_KEY = 'av_token';
export const REFRESH_TOKEN_KEY = 'av_refresh_token';
