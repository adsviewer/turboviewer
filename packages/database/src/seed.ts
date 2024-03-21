import { logger } from '@repo/logger';
import { prisma, type User } from './client';

const DEFAULT_USERS = [
  // Add your own user to pre-populate the database with
  {
    name: 'Tim Apple',
    email: 'tim@apple.com',
  },
] satisfies Partial<User>[];

(async () => {
  try {
    await Promise.all(
      DEFAULT_USERS.map((user) =>
        prisma.user.upsert({
          where: {
            email: user.email,
          },
          update: {
            ...user,
          },
          create: {
            ...user,
          },
        }),
      ),
    );
  } catch (error) {
    logger.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e: unknown) => {
  logger.error(e);
});
