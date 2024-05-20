import { type ReadonlyURLSearchParams } from 'next/navigation';

export const groupedByKey = 'groupedBy';

export interface QueryParamsType {
  key: string;
  value: string;
}

// Signals that the user has altered the url via UI actions so that automatic
// loading of search filters is aborted
export const userActionOverrideParams: QueryParamsType = {
  key: 'overrideFilters',
  value: 'true',
};

// If the specific key exists its value is replaced, otherwise
// it's added as a new key=value param
export const addOrReplaceURLParams = (
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  key: string,
  newValue: string,
): string => {
  const newParams = new URLSearchParams(searchParams.toString());

  // Specific case for groupBy (insights) so that it handles
  // multiple params with the same key & different values
  if (key === groupedByKey) {
    // If it doesn't exist, just add it
    if (!newParams.has(groupedByKey, newValue)) {
      newParams.append(groupedByKey, newValue);
      return `${pathname}?${newParams.toString()}`;
    }
    // If it already exists, remove it!
    newParams.delete(groupedByKey, newValue);
    return `${pathname}?${newParams.toString()}`;
  }

  // Generic logic (replace value or add param if it doesn't exist)
  newParams.set(key, newValue);
  return `${pathname}?${newParams.toString()}`;
};

export const isParamInSearchParams = (searchParams: ReadonlyURLSearchParams, key: string, value: string): boolean => {
  return searchParams.getAll(key).includes(value);
};
