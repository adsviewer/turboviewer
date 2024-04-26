import { useCallback } from 'react';
import { type ReadonlyURLSearchParams } from 'next/navigation';
import { InsightsColumnsGroupBy, type InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

export type OrderType = 'asc' | 'desc';

export interface SearchParams {
  orderBy?: InsightsColumnsOrderBy;
  order?: OrderType;
  page?: string;
  pageSize?: string;
  groupedBy?: InsightsColumnsGroupBy[];
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

export const useCreateGroupedByString = (
  searchParams: ReadonlyURLSearchParams,
): ((name: InsightsColumnsGroupBy, group: boolean) => string) =>
  useCallback(
    (name: InsightsColumnsGroupBy, group: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      const groupedByKey: SearchParamsKeys = 'groupedBy';
      if (group) {
        params.append(groupedByKey, name);
      } else {
        params.delete(groupedByKey, name);
      }

      // We should always remove the page parameter when any of the search params change
      const page: SearchParamsKeys = 'page';
      params.delete(page);

      return params.toString();
    },
    [searchParams],
  );

export const isInsightsColumnsGroupBy = (value: string): value is InsightsColumnsGroupBy =>
  Object.values(InsightsColumnsGroupBy).includes(value as InsightsColumnsGroupBy);
