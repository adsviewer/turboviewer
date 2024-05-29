import { Redis } from 'ioredis';
import { env } from './config';

export const ioredis = new Redis(env.REDIS_URL);

export const redisSet = async (key: string, value: string | number, ttlSec?: number): Promise<void> => {
  if (!ttlSec) {
    await ioredis.set(key, value);
    return;
  }
  await ioredis.psetex(key, ttlSec * 1000, value);
};

export const redisGet = async (key: string): Promise<string | null> => {
  return ioredis.get(key);
};

export const redisExists = async (key: string): Promise<boolean> => {
  return ioredis.exists(key).then((res) => res === 1);
};

export const redisDel = async (key: string): Promise<number> => {
  return ioredis.del(key);
};
