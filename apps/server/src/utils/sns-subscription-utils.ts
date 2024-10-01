import bodyParser from 'body-parser';
import { type NextFunction, type Request, type Response } from 'express';
import MessageValidator from 'sns-validator';
import { logger } from '@repo/logger';
import { jsonMiddleware } from './express-utils';

const validator = new MessageValidator();

export type SNSMessage =
  | ({
      Type: 'SubscriptionConfirmation' | 'UnsubscribeConfirmation';
      Token: string;
      SubscribeURL: string;
    } & SNSMessageCommon)
  | ({
      Type: 'Notification';
      Subject: string;
      UnsubscribeURL: string;
    } & SNSMessageCommon);

interface SNSMessageCommon {
  Message: string;
  MessageId: string;
  TopicArn: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

const snsMiddlewareInner = async (
  req: Request<never, never, SNSMessage>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const validated = await validateSnsMessage(req);
  if (validated) {
    await confirmSubscription(req);
    next();
  } else {
    res.status(403).send({
      message: 'Invalid SNS signature',
    });
  }
};

export const snsMiddleware = [bodyParser.text({ type: 'text/plain' }), jsonMiddleware, snsMiddlewareInner];

const confirmSubscription = async (req: Request<never, never, SNSMessage>) => {
  switch (req.body.Type) {
    case 'SubscriptionConfirmation': {
      logger.info(`Confirming subscription: ${req.body.TopicArn}`);
      const url = new URL(req.body.SubscribeURL);
      if (!/^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(url.host)) {
        logger.warn(`Invalid SubscribeURL: ${req.body.SubscribeURL}`);
        return 'Invalid SubscribeURL';
      }
      const response = await fetch(req.body.SubscribeURL);
      const text = await response.text();
      logger.info(`Subscription confirmed: ${text}`);
      return text;
    }
    case 'UnsubscribeConfirmation':
      logger.warn('Not implemented yet: "UnsubscribeConfirmation" case');
      break;
    case 'Notification':
      break;
  }
};

const validateSnsMessage = async (req: Request<never, never, SNSMessage>) => {
  const message = req.body as unknown as Record<string, unknown> | string;
  return await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
    validator.validate(message, (err, snsMsg) => {
      if (err) {
        reject(err);
      } else {
        resolve(snsMsg);
      }
    });
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    logger.warn(`Invalid SNS signature: ${msg}`);
    return null;
  });
};
