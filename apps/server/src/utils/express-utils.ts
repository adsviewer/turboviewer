import { type NextFunction, type Request, type Response } from 'express';
import { logger } from '@repo/logger';

export const jsonMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument -- This is inside a try/catch block
    req.body = JSON.parse(req.body);
  } catch (e) {
    logger.error(e);
  }
  next();
};
