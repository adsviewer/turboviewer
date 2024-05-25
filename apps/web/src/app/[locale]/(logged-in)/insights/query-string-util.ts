import { useCallback } from 'react';
import { type ReadonlyURLSearchParams } from 'next/navigation';
import {
  type DeviceEnum,
  InsightsColumnsGroupBy,
  type InsightsColumnsOrderBy,
  type InsightsPosition,
  type OrderBy,
  type PublisherEnum,
} from '@/graphql/generated/schema-server';

export interface QueryParamsType {
  key: string;
  value: string;
}

export interface SearchParams {
  orderBy?: InsightsColumnsOrderBy;
  order?: OrderBy;
  page?: string;
  pageSize?: string;
  groupedBy?: InsightsColumnsGroupBy[];
  account?: string;
  adId?: string;
  device?: DeviceEnum;
  publisher?: PublisherEnum;
  position?: InsightsPosition;
}

export type SearchParamsKeys = keyof SearchParams;

// Signals that the user has altered the url via UI actions so that automatic
// loading of search filters is aborted
export const userActionOverrideParams: QueryParamsType = {
  key: 'overrideUserAction',
  value: 'true',
};

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

export const createURLWithQueryParams = (pathname: string, paramsMap: QueryParamsType[]): string => {
  let URLWithQueryParams = `${pathname}/`;

  for (let i = 0; i < paramsMap.length; i++) {
    const prefixChar = i === 0 ? `?` : '&';
    URLWithQueryParams += `${prefixChar}${paramsMap[i].key}=${paramsMap[i].value}`;
  }

  return URLWithQueryParams;
};

export const isParamInSearchParams = (searchParams: ReadonlyURLSearchParams, key: string, value: string): boolean => {
  return searchParams.getAll(key).includes(value);
};
