import express from 'express';
import { createYoga } from 'graphql-yoga';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { logger } from '@repo/logger';
import { Environment, MODE, PORT } from './config';
import { createContext } from './context';
import { schema } from './schema';

process.on('uncaughtException', (reason) => {
  logger.error(reason, 'Uncaught Exception', reason.stack);
});

const index = () => {
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

  app.get('/', (req, res) => {
    res.send('Ok');
  });

  const port = PORT;
  app.listen(port, () => {
    logger.info(`[${MODE}] Server is running on http://localhost:${String(port)}/graphql`);
  });
};

index();
