import { logger } from '@repo/logger';
import { AError, isAError } from '@repo/utils';
import { ioredis } from './ioredis';
import { RedisBatcher } from './redis-batcher';

export interface CacheableDataWrapper<T> {
  expiresAt: number;
  payload: T;
}

export class Cacheable<
  T extends number | string | string[] | object | object[],
  U extends string | object,
  V extends string | object,
> {
  private readonly getKeyFn: (keyArg: U) => Promise<string> | string;
  private readonly fn: (fnArg: V) => Promise<T | AError> | T | AError;
  private readonly batcher: RedisBatcher<T>;
  // Time to live in seconds
  private readonly ttlSec: number;

  constructor(getKey: (keyArg: U) => Promise<string> | string, fn: (fnArg: V) => Promise<T> | T, ttlMs: number) {
    this.getKeyFn = getKey;
    this.fn = fn;
    // Time to live in seconds
    this.ttlSec = ttlMs;
    this.batcher = new RedisBatcher<T>(ioredis);
  }

  async getKey(keyArg: U): Promise<string> {
    return this.getKeyFn(keyArg);
  }

  async has(keyArg: U): Promise<number> {
    const key = await this.getKeyFn(keyArg);
    return ioredis.exists(key);
  }

  async getValue(keyArg: U, fnArg: V): Promise<T | AError> {
    const key = await this.getKeyFn(keyArg);
    const cached = await this.batcher.request(key);

    if (!cached) {
      return await this.forceUpdate(keyArg, fnArg);
    }
    return cached.payload;
  }

  async forceUpdate(keyArg: U, fnArg: V): Promise<T | AError> {
    const key = await this.getKeyFn(keyArg);
    try {
      const data = await this.fn(fnArg);
      if (isAError(data)) {
        logger.error(
          `Error in forceUpdate fn. Key: ${JSON.stringify(keyArg)}. Args: ${JSON.stringify(fnArg)}. Msg: ${data.message}`,
        );
        return data;
      }
      if (data) {
        await ioredis.psetex(
          key,
          this.ttlSec * 1000,
          JSON.stringify({ expiresAt: Date.now() + this.ttlSec * 1000, payload: data }),
        );
      }
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      logger.error(
        `Error in forceUpdate: ${message}. Key: ${JSON.stringify(keyArg)}. Fn args: ${JSON.stringify(fnArg)}`,
      );
      return new AError(message);
    }
  }
}
