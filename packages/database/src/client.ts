// eslint-disable-next-line import/no-relative-packages -- we need to import from the generated client
import { PrismaClient } from '../.prisma';

export const prisma = new PrismaClient();

// eslint-disable-next-line import/no-relative-packages -- we need to import from the generated client
export * from '../.prisma';
