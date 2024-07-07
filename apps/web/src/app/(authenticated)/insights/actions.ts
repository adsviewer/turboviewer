'use server';

import { urqlClientSdk } from '@/lib/urql/urql-client';
import {
  type DeviceEnum,
  type InsightsColumnsGroupBy,
  type InsightsColumnsOrderBy,
  InsightsInterval,
  type InsightsPosition,
  type InsightsQuery,
  type OrderBy,
  type PublisherEnum,
} from '@/graphql/generated/schema-server';

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
  interval?: InsightsInterval;
  fetchPreviews?: string;
}

export default async function getInsights(
  searchParams: SearchParams,
  orderBy: InsightsColumnsOrderBy,
  order: OrderBy,
  pageSize: number,
  page: number,
): Promise<InsightsQuery> {
  return await urqlClientSdk().insights({
    adAccountIds: searchParams.account,
    adIds: searchParams.adId,
    devices: searchParams.device,
    groupBy: searchParams.groupedBy,
    order,
    orderBy,
    page,
    pageSize,
    positions: searchParams.position,
    publishers: searchParams.publisher,
    interval: InsightsInterval.week,
    fetchPreviews: Boolean(searchParams.fetchPreviews),
  });
}
