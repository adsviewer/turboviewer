import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { createYoga } from 'graphql-yoga';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { logger } from '@repo/logger';
import bodyParser from 'body-parser';
import { IntegrationTypeEnum } from '@repo/database';
import { Environment, FireAndForget, MODE } from '@repo/utils';
import { authCallback, getChannel } from '@repo/channel';
import { authEndpoint } from '@repo/channel-utils';
import * as Sentry from '@sentry/node';
import { env } from './config';
import { createContext } from './context';
import { schema } from './schema';
import { snsMiddleware } from './utils/sns-subscription-utils';
import { invokeChannelIngress } from './utils/lambda-utils';
import { authLoginCallback } from './contexts/login-provider/login-provider-helper';
import { authLoginEndpoint } from './contexts/login-provider/login-provider-types';
import { authConfirmUserEmailRateLimiter, loginProviderRateLimiter } from './utils/rate-limiter';
import { authConfirmUserEmailCallback, authConfirmUserEmailEndpoint } from './contexts/user';

const fireAndForget = new FireAndForget();

process.on('uncaughtException', (reason) => {
  logger.error(reason, 'Uncaught Exception', reason.stack);
});

const channelDataRefreshWebhook = (_req: Request, res: Response): void => {
  fireAndForget.add(() => invokeChannelIngress({ initial: false }));
  res.send({
    statusCode: 200,
  });
};

const index = (): void => {
  const app = express();

  const yoga = createYoga({
    schema,
    context: createContext,
    graphiql: MODE !== Environment.Production,
    plugins: MODE !== Environment.Production ? [] : [useDisableIntrospection()],
  });

  app.get(`/api${authEndpoint}`, authCallback);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- This is the entry point
  app.get(`/api${authLoginEndpoint}`, loginProviderRateLimiter, authLoginCallback);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- This is the entry point
  app.get(`/api${authConfirmUserEmailEndpoint}`, authConfirmUserEmailRateLimiter, authConfirmUserEmailCallback);
  app.post('/api/channel/refresh', snsMiddleware, channelDataRefreshWebhook);
  app.post(
    '/api/fb/sign-out',
    bodyParser.urlencoded({ extended: true }),
    getChannel(IntegrationTypeEnum.META).signOutCallback,
  );

  Sentry.setupExpressErrorHandler(app);

  app.use((_, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- This is the entry point
  app.use(yoga.graphqlEndpoint, yoga);

  const port = env.PORT;
  app.listen(port, () => {
    logger.info(`[${MODE}] Server is running on http://localhost:${String(port)}/graphql`);
  });
};

index();
