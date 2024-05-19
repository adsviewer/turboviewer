import { type ReactNode } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';
import InsightsGrid from './components/insights-grid';
import OrderFilters from './components/order-filters';
import { type SearchParams } from './query-string-util';

interface InsightsProps {
  searchParams?: SearchParams;
}

export default async function Insights({ searchParams }: InsightsProps): Promise<ReactNode> {
  const orderBy = searchParams?.orderBy ?? InsightsColumnsOrderBy.spend;
  const pageSize = parseInt(searchParams?.pageSize ?? '12', 10);
  const page = parseInt(searchParams?.page ?? '1', 10);
  const order = searchParams?.order ?? 'desc';

  const resp = await urqlClientSdk().insights({
    adAccountIds: searchParams?.account,
    adIds: searchParams?.adId,
    devices: searchParams?.device,
    groupBy: searchParams?.groupedBy,
    order,
    orderBy,
    page,
    pageSize,
    positions: searchParams?.position,
    publishers: searchParams?.publisher,
  });
  const insights = resp.insights.edges;
  const totalCount = resp.insights.totalCount;

  return (
    <>
      <h1>Insights</h1>
      <OrderFilters resultsCount={totalCount} />
      <InsightsGrid insights={insights} />
    </>
  );
}
