import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { createYoga } from 'graphql-yoga';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { logger } from '@repo/logger';
import bodyParser from 'body-parser';
import { IntegrationTypeEnum } from '@repo/database';
import { FireAndForget } from '@repo/utils';
import { authCallback, getChannel, invokeChannelIngress } from '@repo/channel';
import { authEndpoint } from '@repo/channel-utils';
import * as Sentry from '@sentry/node';
import { Environment, MODE } from '@repo/mode';
import { useSentry } from '@envelop/sentry';
import { env } from './config';
import { createContext } from './context';
import { schema } from './schema';
import { snsMiddleware } from './utils/sns-subscription-utils';
import { authLoginCallback } from './contexts/login-provider/login-provider-helper';
import { authLoginEndpoint } from './contexts/login-provider/login-provider-types';
import {
  authConfirmInvitedUserRateLimiter,
  authConfirmUserEmailRateLimiter,
  loginProviderRateLimiter,
} from './utils/rate-limiter';
import { authConfirmUserEmailCallback, authConfirmUserEmailEndpoint } from './contexts/user/user';
import { authConfirmInvitedUserCallback, authConfirmInvitedUserEndpoint } from './contexts/user/user-invite';

const fireAndForget = new FireAndForget();

process.on('uncaughtException', (reason) => {
  logger.error(reason, 'Uncaught Exception', reason.stack);
});

const channelDataRefreshWebhook = (_req: Request, res: Response): void => {
  fireAndForget.add(() => invokeChannelIngress(false));
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
    plugins: MODE !== Environment.Production ? [useSentry()] : [useSentry(), useDisableIntrospection()],
  });

  // heartbeat
  app.get('/heartbeat', (_req, res) => {
    res.send('Pong!');
  });

  app.get(`/api${authEndpoint}`, authCallback);
  app.get(`/api${authLoginEndpoint}`, loginProviderRateLimiter, authLoginCallback);
  app.get(`/api${authConfirmUserEmailEndpoint}`, authConfirmUserEmailRateLimiter, authConfirmUserEmailCallback);
  app.get(`/api${authConfirmInvitedUserEndpoint}`, authConfirmInvitedUserRateLimiter, authConfirmInvitedUserCallback);
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

  app.use(yoga.graphqlEndpoint, yoga);

  const port = env.PORT;
  app.listen(port, () => {
    logger.info(`[${MODE}] Server is running on http://localhost:${String(port)}/graphql`);
  });
};

index();
