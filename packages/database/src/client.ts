import { readReplicas } from '@prisma/extension-read-replicas';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { Environment, MODE } from '@repo/mode';
// eslint-disable-next-line import/no-relative-packages -- we need to import from the generated client
import { PrismaClient } from '../.prisma';
import { env } from './config';
import './types';

neonConfig.webSocketConstructor = ws;
const connectionString = env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
export const prisma = new PrismaClient(MODE !== Environment.Local ? { adapter } : undefined).$extends(
  readReplicas({
    url: env.DATABASE_RO_URL ?? env.DATABASE_URL,
  }),
);

// eslint-disable-next-line import/no-relative-packages -- we need to import from the generated client
export * from '../.prisma';
