import { type z, ZodError, type ZodIssue, type ZodRawShape } from 'zod';
import { logger } from '@repo/logger';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complex
export const createEnv = <T extends ZodRawShape>(schema: z.ZodObject<T>) => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    if (!(e instanceof ZodError)) throw e;

    e.issues.forEach((issue: ZodIssue) => {
      logger.error(`${issue.message}: ${issue.path.join(',')}`);
    });
    throw e;
    // process.exit(-1);
  }
};
