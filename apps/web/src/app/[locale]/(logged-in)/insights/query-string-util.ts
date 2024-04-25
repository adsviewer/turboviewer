import { useCallback } from 'react';
import { type ReadonlyURLSearchParams } from 'next/navigation';
import { type InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

export type OrderType = 'asc' | 'desc';

export interface SearchParams {
  orderBy?: InsightsColumnsOrderBy;
  order?: OrderType;
  page?: string;
  pageSize?: string;
}

type SearchParamsKeys = keyof SearchParams;

export const useCreateQueryString = (
  searchParams: ReadonlyURLSearchParams,
  keysToDelete?: SearchParamsKeys[],
): ((name: SearchParamsKeys, value: string) => string) =>
  useCallback(
    (name: SearchParamsKeys, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      if (keysToDelete) {
        keysToDelete.forEach((key) => {
          params.delete(key);
        });
      }
      // We should always remove the page parameter when any of the search params change
      const page: SearchParamsKeys = 'page';
      params.delete(page);

      return params.toString();
    },
    [keysToDelete, searchParams],
  );
