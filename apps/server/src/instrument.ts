import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Environment } from '@repo/utils';

Sentry.init({
  dsn: 'https://b3719092a80366bd037eb7b5adfe15ff@o4507502891040768.ingest.de.sentry.io/4507502899560528',
  environment: Environment.Production,
  integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  tracePropagationTargets: [RegExp(/^nikos$/)],
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
