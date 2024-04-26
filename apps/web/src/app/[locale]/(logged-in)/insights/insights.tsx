'use server';
import React from 'react';
import { type AdAccountsQuery, InsightsColumnsOrderBy, type InsightsQuery } from '@/graphql/generated/schema-server';
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
  const accounts = (await urqlClientSdk().adAccounts()).integrations.flatMap((integration) => integration.adAccounts);
  const order = searchParams?.order ?? 'desc';
  const insightsByAccount = await Promise.all(
    accounts.map(
      async (account) =>
        await urqlClientSdk()
          .insights({
            adAccountId: account.id,
            page,
            pageSize,
            order,
            orderBy,
            groupBy: searchParams?.groupedBy,
          })
          .then((response) => {
            return {
              totalCount: response.insights.totalCount,
              insights: response.insights.edges.map((insight) => ({
                ...insight,
                account,
              })),
            };
          }),
    ),
  );

  const insights = insightsByAccount.flatMap((ins) => ins.insights);
  const totalCount = insightsByAccount.reduce((acc, ins) => acc + ins.totalCount, 0);

  return (
    <InsightsNoCall
      insights={insights}
      page={page}
      totalCount={totalCount}
      pageSize={pageSize}
      orderBy={orderBy}
      searchParams={searchParams}
    />
  );
}
