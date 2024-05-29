import express, { type Request, type Response } from 'express';
import { createYoga } from 'graphql-yoga';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { logger } from '@repo/logger';
import bodyParser from 'body-parser';
import { IntegrationTypeEnum } from '@repo/database';
import { Environment, FireAndForget, MODE } from '@repo/utils';
import { authCallback, getChannel } from '@repo/channel';
import { authEndpoint } from '@repo/channel-utils';
import { env } from './config';
import { createContext } from './context';
import { schema } from './schema';
import { snsMiddleware } from './utils/sns-subscription-utils';
import { invokeChannelIngress } from './utils/lambda-utils';
import { authLoginCallback } from './contexts/login-provider/login-provider-helper';
import { authLoginEndpoint } from './contexts/login-provider/login-provider-types';

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

  app.use((_, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- This is the entry point
  app.use(yoga.graphqlEndpoint, yoga);

  app.get(`/api${authEndpoint}`, authCallback);
  app.get(`/api${authLoginEndpoint}`, authLoginCallback);
  app.post('/api/channel/refresh', snsMiddleware, channelDataRefreshWebhook);
  app.post(
    '/api/fb/sign-out',
    bodyParser.urlencoded({ extended: true }),
    getChannel(IntegrationTypeEnum.META).signOutCallback,
  );

  const port = env.PORT;
  app.listen(port, () => {
    logger.info(`[${MODE}] Server is running on http://localhost:${String(port)}/graphql`);
  });
};

index();
