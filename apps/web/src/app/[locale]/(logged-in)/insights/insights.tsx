'use server';
import React from 'react';
import {
  type AdAccountsQuery,
  InsightsColumnsOrderBy,
  InsightsInterval,
  type InsightsQuery,
  OrderBy,
} from '@/graphql/generated/schema-server';
import type { UnwrapArray } from '@/util/types';
import { type SearchParams } from '@/app/[locale]/(logged-in)/insights/query-string-util';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import InsightsNoCall from '@/app/[locale]/(logged-in)/insights/insights-no-call';

interface InsightsProps {
  insights?: (UnwrapArray<InsightsQuery['insights']['edges']> & {
    account: UnwrapArray<UnwrapArray<AdAccountsQuery['integrations']>['adAccounts']>;
  })[];
  searchParams?: SearchParams;
}
export async function Insights({ searchParams }: InsightsProps): Promise<React.ReactElement> {
  const orderBy = searchParams?.orderBy ?? InsightsColumnsOrderBy.spend;
  const pageSize = parseInt(searchParams?.pageSize ?? '12', 10);
  const page = parseInt(searchParams?.page ?? '1', 10);
  const order = searchParams?.order ?? OrderBy.desc;

  const resp = await urqlClientSdk().insights({
    adAccountIds: searchParams?.account,
    adIds: searchParams?.adId,
    devices: searchParams?.device,
    interval: InsightsInterval.week,
    groupBy: searchParams?.groupedBy,
    order,
    orderBy,
    page,
    pageSize,
    positions: searchParams?.position,
    publishers: searchParams?.publisher,
  });
  const insights = resp.insights.edges;

  return (
    <InsightsNoCall
      insights={insights}
      page={page}
      hasNext={resp.insights.hasNext}
      pageSize={pageSize}
      orderBy={orderBy}
      searchParams={searchParams}
    />
  );
}
