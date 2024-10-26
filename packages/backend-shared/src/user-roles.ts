import { Prisma } from '@repo/database';

export const userWithRoles = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    roles: { select: { role: true } },
  },
});

export type UserWithRoles = Prisma.UserGetPayload<typeof userWithRoles>;
