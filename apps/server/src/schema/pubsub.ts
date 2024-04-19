import { createPubSub } from 'graphql-yoga';
import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { ioredis } from '@repo/redis';
import { type IntegrationTypeEnum } from '@repo/database';

const publishClient = ioredis;
const subscribeClient = ioredis.duplicate();

const eventTarget = createRedisEventTarget({
  publishClient,
  subscribeClient,
});

export interface ChannelInitialProgressPayload {
  channel: IntegrationTypeEnum;
  // Progress is a number between 0 and 100
  progress: number;
}

export const pubSub = createPubSub<{
  'user:channel:initial-progress': [userId: string, payload: ChannelInitialProgressPayload];
}>({ eventTarget });
