import { type ReadonlyURLSearchParams } from 'next/navigation';

const groupedByKey = 'groupedBy';

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

export const createQueryParamString = (searchParams: ReadonlyURLSearchParams, key: string, value: string): string => {
  if (!isParamInSearchParams(searchParams, key, value)) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);

    // We should always remove the page parameter when any of the search params change
    // (so that results are return beginning from page 1 again)
    params.delete('page');
    return params.toString();
  }
  return 'error';
};

export const createURLWithNewParam = (
  pathname: string,
  currentParams: ReadonlyURLSearchParams,
  key: string,
  value: string,
): string => {
  const queryParams = createQueryParamString(currentParams, key, value);
  if (currentParams.size === 0) {
    return `${pathname}/?${queryParams}`;
  }
  return `${pathname}?${currentParams.toString()}&${queryParams}`;
};

export const createURLWithRemovedParam = (
  pathname: string,
  currentParams: ReadonlyURLSearchParams,
  key: string,
  value: string,
): string => {
  const paramString = currentParams.toString();
  let newURL = `${pathname}?${paramString}`;

  const paramToRemove = `${key}=${value}`;

  if (paramString.includes(`&${paramToRemove}`)) {
    newURL = newURL.replace(`&${paramToRemove}`, '');
  } else if (paramString.includes(paramToRemove)) {
    newURL = newURL.replace(paramToRemove, '');

    // Handle the case where the first parameter is removed
    if (newURL.endsWith('?')) {
      newURL = newURL.slice(0, -1);
    } else {
      newURL = newURL.replace('?&', '?');
    }
  } else {
    return 'error=RemovedParamNotFound';
  }

  return newURL;
};

// Replaces the value of a query param's key of a URL
// export const createURLWithReplacedParam = (
//   pathname: string,
//   searchParams: ReadonlyURLSearchParams,
//   key: string,
//   newValue: string,
// ): string => {
//   const newParams = new URLSearchParams(searchParams.toString());
//   const newURL = `${pathname}?${paramString}`;

//   const regex = new RegExp(`([?&])(${key}=)([^&]*)`, 'i');

//   if (newURL.match(regex)) {
//     return newURL.replace(regex, `$1${key}=${newValue}`);
//   }
//   const separator = newURL.includes('?') ? '&' : '?';
//   return `${newURL}${separator}${key}=${newValue}`;
// };

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
    if (!newParams.has(groupedByKey, newValue)) {
      newParams.set(groupedByKey, newValue);
      return `${pathname}?${newParams.toString()}`;
    }
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
