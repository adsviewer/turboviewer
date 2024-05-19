import { type ReadonlyURLSearchParams } from 'next/navigation';

export interface QueryParamsType {
  key: string;
  value: string;
}
// Signals that the user has altered the url via UI actions so that automatic
// loading of search filters is aborted
export const userActionOverrideParams: QueryParamsType = {
  key: 'overrideByUserAction',
  value: 'true',
};

// export const createURLWithParm = (currentUrl: string, key: string, value: string): boolean => {
//   return searchParams.getAll(key).includes(value);
// };

export const isParamInSearchParams = (searchParams: ReadonlyURLSearchParams, key: string, value: string): boolean => {
  return searchParams.getAll(key).includes(value);
};
