import { logger } from '@repo/logger';

export interface UrqlSuccessResult<TData> {
  success: true;
  data: TData;
}

export interface UrqlErrorResult<TError> {
  success: false;
  error: TError;
  data?: never;
}

export type UrqlResult<TData = unknown, TError = unknown> = UrqlSuccessResult<TData> | UrqlErrorResult<TError>;

export const handleUrqlRequest = async <TData extends object, TError = unknown>(
  operationPromise: Promise<TData>,
): Promise<UrqlResult<TData, TError | string>> => {
  try {
    const data = await operationPromise;

    const firstKey = Object.keys(data)[0];
    const firstValue = data[firstKey as keyof TData];
    if (
      firstValue &&
      typeof firstValue === 'object' &&
      '__typename' in firstValue &&
      typeof firstValue.__typename === 'string' &&
      firstValue.__typename.includes('Error') &&
      'error' in firstValue
    ) {
      return {
        success: false,
        error: firstValue.error as TError,
      } satisfies UrqlResult<TData>;
    }

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
