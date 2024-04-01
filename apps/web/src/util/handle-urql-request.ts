import { logger } from '@repo/logger';

export interface UrqlSuccessResult<TData> {
  success: true;
  error?: never;
  data: TData;
}

export interface UrqlErrorResult<TError> {
  success: false;
  error: TError;
  data?: never;
}

export type UrqlResult<TData = unknown, TError = unknown> = UrqlSuccessResult<TData> | UrqlErrorResult<TError>;

export const handleUrqlRequest = async <TData>(
  operationPromise: Promise<TData>,
): Promise<UrqlResult<TData, string>> => {
  try {
    const data = await operationPromise;

    return {
      success: true,
      data,
    } satisfies UrqlResult<TData>;
  } catch (err) {
    let error: string;

    if (err instanceof Error) {
      error = err.message.replace('[GraphQL] ', '');
    } else {
      logger.error(err);
      error = 'Request handler error';
    }

    return {
      success: false,
      error,
    } satisfies UrqlResult<TData, string>;
  }
};
