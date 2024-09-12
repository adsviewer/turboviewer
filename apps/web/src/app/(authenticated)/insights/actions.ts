'use server';

import { urqlClientSdk } from '@/lib/urql/urql-client';
import {
  type DeviceEnum,
  type InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  type InsightsPosition,
  type InsightsQuery,
  type OrderBy,
  type PublisherEnum,
  type InsightsSearchExpression,
} from '@/graphql/generated/schema-server';

export interface SearchParams {
  orderBy?: InsightsColumnsOrderBy;
  order?: OrderBy;
  page?: number;
  pageSize?: number;
  groupedBy?: InsightsColumnsGroupBy[];
  account?: string;
  adId?: string;
  device?: DeviceEnum;
  publisher?: PublisherEnum;
  position?: InsightsPosition;
  interval?: InsightsInterval;
  fetchPreviews?: string;
  dateFrom?: number;
  dateTo?: number;
  search?: string;
}

export default async function getInsights(searchParams: SearchParams): Promise<InsightsQuery> {
  const parsedSearch: InsightsSearchExpression = searchParams.search
    ? (JSON.parse(Buffer.from(searchParams.search, 'base64').toString('utf-8')) as InsightsSearchExpression)
    : {};

  return await urqlClientSdk().insights({
    adAccountIds: searchParams.account,
    adIds: searchParams.adId,
    dateFrom: searchParams.dateFrom ? new Date(Number(searchParams.dateFrom)) : undefined,
    dateTo: searchParams.dateTo ? new Date(Number(searchParams.dateTo)) : undefined,
    devices: searchParams.device,
    groupBy: searchParams.groupedBy,
    order: searchParams.order,
    orderBy: searchParams.orderBy ?? InsightsColumnsOrderBy.impressions_abs,
    page: searchParams.page ? Number(searchParams.page) : 1,
    pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 12,
    positions: searchParams.position,
    publishers: searchParams.publisher,
    interval: searchParams.interval ?? InsightsInterval.week,
    search: parsedSearch,
  });
}
