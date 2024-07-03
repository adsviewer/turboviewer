import { Suspense, type ReactNode } from 'react';
import { Flex } from '@mantine/core';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import {
  type DeviceEnum,
  type InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  type InsightsPosition,
  OrderBy,
  type PublisherEnum,
} from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
import InsightsGrid from './components/insights-grid';
import OrderFilters from './components/order-filters';
import PageControls from './components/page-controls';

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

interface InsightsProps {
  searchParams: SearchParams;
}

export default async function Insights({ searchParams }: InsightsProps): Promise<ReactNode> {
  const orderBy = searchParams.orderBy ?? InsightsColumnsOrderBy.spend_rel;
  const order = searchParams.order ?? OrderBy.desc;
  const pageSize = parseInt(searchParams.pageSize ?? '12', 10);
  const page = parseInt(searchParams.page ?? '1', 10);

  const resp = await urqlClientSdk().insights({
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
  const insights = resp.insights.edges;
  const hasNextPage = resp.insights.hasNext;

  return (
    <>
      <OrderFilters />
      <Suspense fallback={<LoaderCentered type="dots" />}>
        <Flex direction="column">
          <InsightsGrid insights={insights} />
          <PageControls hasNextPage={hasNextPage} />
        </Flex>
      </Suspense>
    </>
  );
}
