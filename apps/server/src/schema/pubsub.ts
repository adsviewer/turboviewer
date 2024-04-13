import { createPubSub } from 'graphql-yoga';
import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { ioredis } from '@repo/redis';

const publishClient = ioredis;
const subscribeClient = ioredis.duplicate();

const eventTarget = createRedisEventTarget({
  publishClient,
  subscribeClient,
});

export const pubSub = createPubSub<{
  'user:fb:progress': [payload: number];
}>({ eventTarget });
