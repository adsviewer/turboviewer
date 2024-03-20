import { PrismaClient } from '../.prisma';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  // eslint-disable-next-line no-unused-vars
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// eslint-disable-next-line no-undef
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export * from "../.prisma";
