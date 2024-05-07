import React from 'react';
import Pagination from '@/components/filters/pagination';
import Insight from '@/app/[locale]/(logged-in)/insights/insight';
import { type InsightsColumnsOrderBy, type InsightsQuery } from '@/graphql/generated/schema-server';
import type { SearchParams } from '@/app/[locale]/(logged-in)/insights/query-string-util';

interface InsightsNoCallProps {
  page: number;
  totalCount: number;
  pageSize: number;
  orderBy: InsightsColumnsOrderBy;
  searchParams?: SearchParams;
  insights: InsightsQuery['insights']['edges'];
}

export default function InsightsNoCall({
  page,
  totalCount,
  pageSize,
  orderBy,
  searchParams,
  insights,
}: InsightsNoCallProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <Pagination
        page={page}
        totalCount={totalCount}
        pageSize={pageSize}
        orderBy={orderBy}
        searchParams={searchParams}
        pageInfo={{ page, size: pageSize, totalElements: totalCount }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {insights.map((insight) => (
          <Insight
            key={`${insight.adId ?? 'null'}${String(insight.date)}${String(insight.device)}${String(insight.publisher)}${String(insight.position)}`}
            {...insight}
          />
        ))}
      </div>
      {pageSize > 10 && totalCount > 10 && (
        <Pagination
          page={page}
          totalCount={totalCount}
          pageSize={pageSize}
          orderBy={orderBy}
          searchParams={searchParams}
          pageInfo={{ page, size: pageSize, totalElements: totalCount }}
        />
      )}
    </div>
  );
}
