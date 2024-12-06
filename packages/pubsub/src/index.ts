import { createPubSub } from 'graphql-yoga';
import { createRedisEventTarget } from '@graphql-yoga/redis-event-target';
import { ioredis } from '@repo/redis';
import { type IntegrationTypeEnum } from '@repo/database';
import { type NotificationEvent, type IntegrationStatsUpdateEvent, type NewIntegrationEvent } from '@repo/shared-types';

const publishClient = ioredis;
const subscribeClient = ioredis.duplicate();

export const quitSubClient = async (): Promise<void> => {
  await subscribeClient.quit();
};

const eventTarget = createRedisEventTarget({
  publishClient,
  subscribeClient,
});

export interface ChannelInitialProgressPayload {
  channel: IntegrationTypeEnum;
  // Progress is a number between 0 and 100
  progress: number;
}

// Subscription events
export const pubSub = createPubSub<{
  'user:notification:new-notification': [userId: string, payload: NotificationEvent];
  'user:channel:initial-progress': [userId: string, payload: ChannelInitialProgressPayload];
  'organization:integration:new-integration': [organizationId: string, payload: NewIntegrationEvent];
  'organization:integration:status-update': [organizationId: string, payload: IntegrationStatsUpdateEvent];
}>({ eventTarget });
