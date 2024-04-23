import { createClient, type RedisClientType, type RedisFunctions, type RedisModules, type RedisScripts } from 'redis';
import { logger } from '@repo/logger';
import { env } from './config';

const makeRedis = async (): Promise<RedisClientType<RedisModules, RedisFunctions, RedisScripts>> =>
  createClient({
    url: env.REDIS_URL,
  })
    .on('error', (err) => {
      logger.error(`Redis Client Error ${JSON.stringify(err)}`);
    })
    .connect();

export const redis = await makeRedis();

export * from './ioredis';
