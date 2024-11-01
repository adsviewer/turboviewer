import { type ReadonlyURLSearchParams } from 'next/navigation';
import { sentenceCase } from 'change-case';
import { InsightsColumnsGroupBy } from '@/graphql/generated/schema-server';

export interface GenericRequestResponseBody {
  success: boolean;
  error: {
    message: string;
  };
}

export enum ChartMetricsEnum {
  Impressions = 'impressions_abs',
  Spent = 'spend_abs',
  CPM = 'cpm_abs',
  CPC = 'cpc_abs',
  Clicks = 'clicks_abs',
  ImpressionsCPM = 'impressions_cpm',
  SpentCPM = 'spent_cpm',
}

export const urlKeys = {
  error: 'error',
  groupedBy: 'groupedBy',
  publisher: 'publisher',
  device: 'device',
  position: 'position',
  adAccount: 'adAccount',
  page: 'page',
  pageSize: 'pageSize',
  orderDirection: 'order',
  orderBy: 'orderBy',
  interval: 'interval',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  fetchPreviews: 'fetchPreviews',
  email: 'email',
  search: 'search',
  chartMetric: 'chartMetric',
};

export const positions = [
  'an_classic',
  'biz_disco_feed',
  'facebook_reels',
  'facebook_reels_overlay',
  'facebook_stories',
  'feed',
  'instagram_explore',
  'instagram_explore_grid_home',
  'instagram_profile_feed',
  'instagram_reels',
  'instagram_search',
  'instagram_stories',
  'instream_video',
  'marketplace',
  'messenger_inbox',
  'messenger_stories',
  'rewarded_video',
  'right_hand_column',
  'search',
  'video_feeds',
  'unknown',
].map((pos) => ({ value: pos, label: sentenceCase(pos) }));

export const OrderDirection = {
  asc: 'asc',
  desc: 'desc',
};

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
// it's added as a new key=value param.
// If the key=value pair exists, it is removed
export const addOrReplaceURLParams = (
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  key: string,
  newValue?: string,
): string => {
  const multiKeyParams = [urlKeys.groupedBy, urlKeys.publisher, urlKeys.device, urlKeys.position, urlKeys.adAccount];
  const newParams = new URLSearchParams(searchParams.toString());

  // First, make sure to remove the 'page' param so that the new results start from the 1st page
  newParams.delete(urlKeys.page);

  // Specific case for handling keys that can co-exist with different values
  if (multiKeyParams.includes(key)) {
    // If it doesn't exist, just add it
    if (!newParams.has(key, newValue) && newValue) {
      newParams.append(key, newValue);
      return `${pathname}?${newParams.toString()}`;
    }
    // If it already exists, remove it!
    newParams.delete(key, newValue);

    // (Special case) Don't allow preview fetching if adId is not in group filters (except in summary!)!
    if (!newParams.has(urlKeys.groupedBy, InsightsColumnsGroupBy.adId) && pathname !== '/summary') {
      newParams.delete(urlKeys.fetchPreviews);
    }

    return `${pathname}?${newParams.toString()}`;
  }

  // Generic logic (replace value or add param if it doesn't exist)
  if (newValue) {
    newParams.set(key, newValue);
  } else {
    newParams.delete(key);
  }

  return `${pathname}?${newParams.toString()}`;
};

export const isParamInSearchParams = (searchParams: ReadonlyURLSearchParams, key: string, value: string): boolean => {
  return searchParams.getAll(key).includes(value);
};
