import { type z, ZodError, type ZodIssue, type ZodRawShape } from 'zod';
import { logger } from '@repo/logger';

export enum Environment {
  Production = 'prod',
  Demo = 'demo',
  Local = 'local',
}

export const isMode = (val: string): val is Environment => Object.values(Environment).includes(val as Environment);

export const MODE = !process.env.MODE || !isMode(process.env.MODE) ? Environment.Local : process.env.MODE;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complex
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
