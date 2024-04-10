import { z } from 'zod';
import { commonSchema, createEnv } from '@repo/utils';

export enum Environment {
  Production = 'prod',
  Demo = 'demo',
  Local = 'local',
}

export const isMode = (val: string): val is Environment => Object.values(Environment).includes(val as Environment);

export const MODE = !process.env.MODE || !isMode(process.env.MODE) ? Environment.Local : process.env.MODE;

const defaultPort = '4000';
const schema = z
  .object({
    API_ENDPOINT: z.string().url().default(`http://localhost:${defaultPort}/api`),
    AWS_REGION: z.string().min(1).default('eu-central-1'),
    CHANNEL_SECRET: z.string().min(1).default('channelSecret'),
    FB_APPLICATION_ID: z.string().length(17),
    FB_APPLICATION_SECRET: z.string().length(32),
    PORT: z
      .string()
      .min(1)
      .max(5)
      .transform((val) => parseInt(val))
      .default(defaultPort),
    PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  })
  .merge(commonSchema);

export const env = createEnv(schema);
