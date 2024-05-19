import { Redis } from 'ioredis';
import { env } from './config';

export const ioredis = new Redis(env.REDIS_URL);

export const redisSet = async (key: string, value: string, ttlSec?: number): Promise<void> => {
  if (!ttlSec) {
    await ioredis.set(key, value);
    return;
  }
  await ioredis.psetex(key, ttlSec * 1000, value);
};

export const redisGet = async (key: string): Promise<string | null> => {
  return ioredis.get(key);
};

export const redisDel = async (key: string): Promise<number> => {
  return ioredis.del(key);
};
