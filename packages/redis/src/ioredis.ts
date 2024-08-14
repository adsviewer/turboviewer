import { Redis } from 'ioredis';
import { stringifySorted } from '@repo/utils';
import { env } from './config';

export const ioredis = new Redis(env.REDIS_URL);

export const redisSet = async (key: string, value: string | number | object, ttlSec?: number): Promise<void> => {
  const serializedValue = typeof value === 'object' ? stringifySorted(value) : value;
  if (!ttlSec) {
    await ioredis.set(key, serializedValue);
    return;
  }
  await ioredis.set(key, serializedValue, 'EX', ttlSec);
};

export const redisGet = async <T extends object | string | boolean>(key: string): Promise<null | T> => {
  const serializedValue = await ioredis.get(key);
  if (!serializedValue) return null;
  try {
    return JSON.parse(serializedValue) as T;
  } catch (e) {
    return serializedValue as T;
  }
};

export const getAllSet = async <T extends object | string | boolean>(key: string): Promise<T[]> => {
  const serializedValue = await ioredis.smembers(key);
  try {
    return serializedValue.map((value) => JSON.parse(value) as T);
  } catch (e) {
    return serializedValue as T[];
  }
};

export const redisAddToSet = async (key: string, value: string | number | object, ttlSec?: number): Promise<void> => {
  const serializedValue = typeof value === 'object' ? stringifySorted(value) : value;
  const multiPipeline = ioredis.multi();
  void multiPipeline.sadd(key, serializedValue);
  if (ttlSec) {
    void multiPipeline.expire(key, ttlSec);
  }
  await multiPipeline.exec();
};

export const redisRemoveFromSet = async (key: string, value: string | number | object): Promise<void> => {
  const serializedValue = typeof value === 'object' ? stringifySorted(value) : value;
  await ioredis.srem(key, serializedValue);
};

export const redisGetKeys = (key: string): Promise<string[]> => ioredis.keys(`${key}*`);

export const redisExists = async (key: string): Promise<boolean> => {
  return ioredis.exists(key).then((res) => res === 1);
};

export const redisDel = async (key: string): Promise<number> => {
  return ioredis.del(key);
};

export const redisIncr = async (key: string): Promise<number> => {
  return ioredis.incr(key);
};

export const redisExpire = async (key: string, ttlSec: number): Promise<number> => {
  return ioredis.expire(key, ttlSec);
};

export const redisDelPattern = (pattern: string): void => {
  const stream = ioredis.scanStream({ match: pattern });
  stream.on('data', (keys: string[]) => {
    if (keys.length) {
      const pipeline = ioredis.pipeline();
      keys.forEach((key: string) => {
        pipeline.del(key);
      });
      void pipeline.exec();
    }
  });
};
