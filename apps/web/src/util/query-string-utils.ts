import { useCallback } from 'react';
import { type ReadonlyURLSearchParams } from 'next/navigation';

export const useCreateQueryString = (
  searchParams: ReadonlyURLSearchParams,
): ((name: string, value: string) => string) =>
  useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );
