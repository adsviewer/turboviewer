import { readReplicas } from '@prisma/extension-read-replicas';
// eslint-disable-next-line import/no-relative-packages -- we need to import from the generated client
import { PrismaClient } from '../.prisma';
import { env } from './config.ts';

export const prisma = new PrismaClient().$extends(
  readReplicas({
    url: process.env.READ_ONLY_DATABASE_URL ?? env.DATABASE_URL,
  }),
);

// eslint-disable-next-line import/no-relative-packages -- we need to import from the generated client
export * from '../.prisma';
