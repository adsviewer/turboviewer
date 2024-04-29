import { useCallback } from 'react';
import { type ReadonlyURLSearchParams } from 'next/navigation';
import {
  type DeviceEnum,
  InsightsColumnsGroupBy,
  type InsightsColumnsOrderBy,
  type PublisherEnum,
} from '@/graphql/generated/schema-server';

export type OrderType = 'asc' | 'desc';

export interface SearchParams {
  orderBy?: InsightsColumnsOrderBy;
  order?: OrderType;
  page?: string;
  pageSize?: string;
  groupedBy?: InsightsColumnsGroupBy[];
  account?: string;
  ad?: string;
  device?: DeviceEnum;
  publisher?: PublisherEnum;
  position?: string;
}

export type SearchParamsKeys = keyof SearchParams;

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

export const useCreateGroupedByString = <T extends string>(
  searchParams: ReadonlyURLSearchParams,
  key: SearchParamsKeys,
): ((name: T, group: boolean) => string) =>
  useCallback(
    (name: T, group: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (group) {
        params.append(key, name);
      } else {
        params.delete(key, name);
      }

      // We should always remove the page parameter when any of the search params change
      const page: SearchParamsKeys = 'page';
      params.delete(page);

      return params.toString();
    },
    [key, searchParams],
  );

export const isInsightsColumnsGroupBy = (value: string): value is InsightsColumnsGroupBy =>
  Object.values(InsightsColumnsGroupBy).includes(value as InsightsColumnsGroupBy);
