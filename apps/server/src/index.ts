import express from 'express';
import { createYoga } from 'graphql-yoga';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { logger } from '@repo/logger';
import bodyParser from 'body-parser';
import { IntegrationTypeEnum } from '@repo/database';
import { env, Environment, MODE } from './config';
import { createContext } from './context';
import { schema } from './schema';
import { authCallback } from './contexts/channels/integration-helper';
import { getChannel } from './contexts/channels/channel-helper';
import { authEndpoint } from './contexts/channels/integration-util';
import { snsMiddleware } from './utils/sns-subscription-utils';
import { channelDataRefreshWebhook } from './contexts/channels/data-refresh';

process.on('uncaughtException', (reason) => {
  logger.error(reason, 'Uncaught Exception', reason.stack);
});

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
