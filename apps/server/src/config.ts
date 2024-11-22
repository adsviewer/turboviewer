import { z } from 'zod';
import { awsSchema, channelSchema, commonSchema, createEnv } from '@repo/utils';

const defaultPort = '4000';
const schema = z
  .object({
    API_ENDPOINT: z.string().url().default(`http://localhost:${defaultPort}/api`),
    CHANNEL_SECRET: z.string().min(1).default('channelSecret'),
    GOOGLE_LOGIN_APPLICATION_ID: z.string().min(1),
    GOOGLE_LOGIN_APPLICATION_SECRET: z.string().min(1),
    EMAILABLE_API_KEY: z.string().min(1),
    SLACK_WEBHOOK_URL_PUBLIC_FEEDBACK: z.string().url().optional(),
    PORT: z
      .string()
      .min(1)
      .max(5)
      .transform((val) => parseInt(val))
      .default(defaultPort),
    PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  })
  .merge(channelSchema)
  .merge(commonSchema)
  .merge(awsSchema);

export const env = createEnv(schema);
