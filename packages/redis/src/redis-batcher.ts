/**
 * Mostly adapted from https://github.com/prisma/prisma/blob/fe3d63cc11678d756732ad14887eea62b2590c36/packages/client/src/runtime/DataLoader.ts
 *
 * This adds some extra overhead but nukes some n+1 stuff without us having to change code.
 */

import type { Redis } from 'ioredis';
import { logger } from '@repo/logger';
import { type CacheableDataWrapper } from './cacheable';

export interface Job<T> {
  resolve: (data?: T) => void;
  reject: (data: unknown) => void;
}

export class RedisBatcher<T> {
  private readonly batches: Map<string, Job<CacheableDataWrapper<T>>[]>;
  private tickActive = false;

  constructor(private readonly redis: Redis) {
    this.batches = new Map();
  }

  request(unNormalizedKey: string | number): Promise<CacheableDataWrapper<T> | undefined> {
    const key = String(unNormalizedKey);

    if (!this.batches.has(key)) {
      this.batches.set(key, []);

      // Make sure that we only tick once at a time
      if (!this.tickActive) {
        this.tickActive = true;
        process.nextTick(() => {
          this.dispatchBatches();
          this.tickActive = false;
        });
      }
    }

    return new Promise((resolve, reject) => {
      this.batches.get(key)?.push({
        resolve,
        reject,
      });
    });
  }

  private dispatchBatches(): void {
    this.batches.forEach((batch, key) => {
      this.batches.delete(key);
      void this.loadValue(key, batch);
    });
  }

  private async loadValue(
    key: string,
    jobs: Job<CacheableDataWrapper<T>>[],
  ): Promise<CacheableDataWrapper<T> | undefined> {
    try {
      const cached = await this.redis.get(key);
      const data = cached ? (JSON.parse(cached) as CacheableDataWrapper<T>) : undefined;

      jobs.forEach((job) => {
        job.resolve(data);
      });
      return data;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      logger.error(`Error in loadValue for key ${key}. Message: ${message}`);
      jobs.forEach((job) => {
        job.reject(e);
      });
      return undefined;
    }
  }

  readonly [Symbol.toStringTag] = 'RedisBatcher';
}
