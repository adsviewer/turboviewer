import React from 'react';
import Pagination from '@/components/filters/pagination';
import Insight from '@/app/[locale]/(logged-in)/insights/insight';
import { type InsightsColumnsOrderBy, type InsightsQuery } from '@/graphql/generated/schema-server';
import type { SearchParams } from '@/app/[locale]/(logged-in)/insights/query-string-util';

interface InsightsNoCallProps {
  page: number;
  pageSize: number;
  hasNext: boolean;
  orderBy: InsightsColumnsOrderBy;
  searchParams?: SearchParams;
  insights: InsightsQuery['insights']['edges'];
}

export default function InsightsNoCall({
  hasNext,
  page,
  pageSize,
  orderBy,
  searchParams,
  insights,
}: InsightsNoCallProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <Pagination orderBy={orderBy} searchParams={searchParams} pageInfo={{ page, size: pageSize, hasNext }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {insights.map((insight) => (
          <Insight
            key={`${insight.adId ?? 'null'}${String(insight.device)}${String(insight.publisher)}${String(insight.position)}`}
            {...insight}
          />
        ))}
      </div>
      {pageSize > 10 && hasNext ? (
        <Pagination orderBy={orderBy} searchParams={searchParams} pageInfo={{ page, size: pageSize, hasNext }} />
      ) : null}
    </div>
  );
}
