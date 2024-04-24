import React, { type JSX } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { InsightsColumnsGroupBy } from '@/graphql/generated/schema-server';
import Insight from '@/app/[locale]/(logged-in)/insights/insight';

export async function Insights(): Promise<JSX.Element> {
  const accounts = (await urqlClientSdk().adAccounts()).integrations.flatMap((integration) => integration.adAccounts);
  const insights = await Promise.all(
    accounts.map(
      async (account) =>
        await urqlClientSdk()
          .insights({
            adAccountId: account.id,
            groupBy: [InsightsColumnsGroupBy.device, InsightsColumnsGroupBy.date],
          })
          .then((response) => {
            return response.insights.edges.map((insight) => ({
              ...insight,
              account,
            }));
          }),
    ),
  ).then((response) => response.flat());
  return (
    <div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {insights.map((insight) => (
          <Insight
            key={`${insight.adId ?? 'null'}${String(insight.date)}${String(insight.device)}${String(insight.publisher)}${String(insight.position)}`}
            {...insight}
          />
        ))}
      </div>
    </div>
  );
}
