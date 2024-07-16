import PQueue from 'p-queue';
import { logger } from '@repo/logger';
import { isAError } from './error-helper';

interface FireAndForgetOpts {
  concurrency?: number;
}

export class FireAndForget {
  _shutoff = false;
  _queue: PQueue;

  constructor(params?: FireAndForgetOpts) {
    this._shutoff = false;
    this._queue = new PQueue({
      concurrency: params?.concurrency ?? 10,
    });
  }

  add<T>(fun: () => Promise<T>): void {
    if (this._shutoff) {
      return;
    }

    const wrappedFun = (): Promise<T | undefined> =>
      fun().catch((e: unknown) => {
        logger.error(e instanceof Error ? e.message : JSON.stringify(e));
        return undefined;
      });

    this._queue
      .add(wrappedFun)
      .then((f) => {
        if (isAError(f)) {
          logger.error(f.message);
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.message !== "Cannot read properties of undefined (reading 'catch')") {
          logger.error(e.message);
        }
      });
  }

  stop(): void {
    this._shutoff = true;
    this._queue.clear();
  }
}
