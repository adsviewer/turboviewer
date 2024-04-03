import { z } from 'zod';
import { createEnv } from '@repo/utils';

export enum Environment {
  Production = 'prod',
  Demo = 'demo',
  Local = 'local',
}

const isMode = (val: string): val is Environment => Object.values(Environment).includes(val as Environment);

export const MODE = !process.env.MODE || !isMode(process.env.MODE) ? Environment.Local : process.env.MODE;

const schema = z.object({
  AWS_REGION: z.string().min(1).default('eu-central-1'),
  AUTH_SECRET: z.string().min(1).default('something'),
  REFRESH_SECRET: z.string().min(1).default('refreshSecret'),
  PORT: z
    .string()
    .min(1)
    .max(5)
    .transform((val) => parseInt(val))
    .default('4000'),
  PUBLIC_URL: z.string().url().default('http://localhost:3000'),
});

export const env = createEnv(schema);

export const AUTH_SECRET = env.AUTH_SECRET;
export const AWS_REGION = env.AWS_REGION;
export const PORT = env.PORT;

export const DOMAIN = 'adsviewer.io';
export const PUBLIC_URL = env.PUBLIC_URL;
export const HOSTED_URL = MODE === Environment.Local ? `https://app.demo.${DOMAIN}` : `https://app.${DOMAIN}`;
