import { Redis } from 'ioredis';
import { env } from './config';

export const ioredis = new Redis(env.REDIS_URL);

export const redisSet = async (key: string, value: string | number | object, ttlSec?: number): Promise<void> => {
  const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
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
