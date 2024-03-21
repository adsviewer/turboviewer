import { type z, ZodError, type ZodIssue, type ZodRawShape } from 'zod';
import { logger } from '@repo/logger';

export const createEnv = <T extends ZodRawShape>(schema: z.ZodObject<T>) => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    if (!(e instanceof ZodError)) throw e;

    e.issues.forEach((issue: ZodIssue) => {
      logger.error(`${issue.message}: ${issue.path.join(',')}`);
    });
    process.exit(-1);
  }
};
