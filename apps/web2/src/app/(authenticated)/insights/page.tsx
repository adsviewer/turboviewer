import { Suspense, type ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import {
  type DeviceEnum,
  type InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  type PublisherEnum,
} from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
import InsightsGrid from './components/insights-grid';
import OrderFilters from './components/order-filters';

export interface SearchParams {
  orderBy?: InsightsColumnsOrderBy;
  order?: string;
  page?: string;
  pageSize?: string;
  groupedBy?: InsightsColumnsGroupBy[];
  account?: string;
  adId?: string;
  device?: DeviceEnum;
  publisher?: PublisherEnum;
  position?: string;
}

interface InsightsProps {
  searchParams?: SearchParams;
}

export default async function Insights({ searchParams }: InsightsProps): Promise<ReactNode> {
  const t = await getTranslations('insights');
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
      <h1>{t('title')}</h1>
      <OrderFilters resultsCount={totalCount} />
      <Suspense fallback={<LoaderCentered type="dots" />}>
        <InsightsGrid insights={insights} />
      </Suspense>
    </>
  );
}
