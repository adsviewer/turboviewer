import { z } from 'zod';
import { createEnv } from '@repo/utils';

const defaultPort = '4000';
const schema = z.object({
  API_ENDPOINT: z.string().url().default(`http://localhost:${defaultPort}/api`),
  AWS_ACCOUNT_ID: z.string().length(12),
  AWS_REGION: z.string().default('eu-central-1'),
  AWS_USERNAME: z.string(),
  TIKTOK_REPORT_REQUESTS_QUEUE_URL: z
    .string()
    .url()
    .default(
      `https://sqs.eu-central-1.amazonaws.com/${String(process.env.AWS_ACCOUNT_ID)}/local-${String(process.env.AWS_USERNAME)}-report-requests`,
    ),
});

export const env = createEnv(schema);
