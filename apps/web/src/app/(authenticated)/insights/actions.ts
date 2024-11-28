'use server';

import { urqlClientSdk } from '@/lib/urql/urql-client';
import {
  type DeviceEnum,
  type InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  type InsightsPosition,
  type InsightsQuery,
  type IntegrationType,
  type OrderBy,
  type PublisherEnum,
} from '@/graphql/generated/schema-server';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';
import { type SearchExpression } from '../../../components/search/types-and-utils';

export interface InsightsParams {
  orderBy?: InsightsColumnsOrderBy;
  order?: OrderBy;
  page?: number;
  pageSize?: number;
  groupedBy?: InsightsColumnsGroupBy[];
  adAccounts?: string | string[];
  adIds?: string;
  creativeIds?: string;
  integrations?: IntegrationType[];
  device?: DeviceEnum;
  publisher?: PublisherEnum[];
  position?: InsightsPosition;
  interval?: InsightsInterval;
  fetchPreviews?: string;
  dateFrom?: number;
  dateTo?: number;
  search?: string;
}

export default async function getInsights(insightsParams: InsightsParams): Promise<UrqlResult<InsightsQuery>> {
  const parsedSearchData: SearchExpression = insightsParams.search
    ? (JSON.parse(Buffer.from(insightsParams.search, 'base64').toString('utf-8')) as SearchExpression)
    : {};

  delete parsedSearchData.isAdvancedSearch;
  delete parsedSearchData.clientSearchTerms;

  return await handleUrqlRequest(
    (await urqlClientSdk()).insights({
      adAccountIds: insightsParams.adAccounts,
      adIds: insightsParams.adIds,
      creativeIds: insightsParams.creativeIds,
      integrations: insightsParams.integrations,
      dateFrom: insightsParams.dateFrom ? new Date(Number(insightsParams.dateFrom)) : undefined,
      dateTo: insightsParams.dateTo ? new Date(Number(insightsParams.dateTo)) : undefined,
      devices: insightsParams.device,
      groupBy: insightsParams.groupedBy,
      order: insightsParams.order,
      orderBy: insightsParams.orderBy ?? InsightsColumnsOrderBy.impressions_abs,
      page: insightsParams.page ? Number(insightsParams.page) : 1,
      pageSize: insightsParams.pageSize ? Number(insightsParams.pageSize) : 12,
      positions: insightsParams.position,
      publishers: insightsParams.publisher,
      interval: insightsParams.interval ?? InsightsInterval.week,
      search: parsedSearchData,
    }),
  );
}
