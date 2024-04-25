import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { Insights } from '@/app/[locale]/(logged-in)/insights/insights';
import { OrderBy } from '@/components/filters/order-by';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

interface InsightsProps {
  searchParams?: {
    orderBy?: InsightsColumnsOrderBy;
    page?: string;
  };
}
export default function Page({ searchParams }: InsightsProps): JSX.Element {
  const orderBy = searchParams?.orderBy ?? InsightsColumnsOrderBy.spend;
  return (
    <div>
      <OrderBy orderBy={orderBy} />
      <Suspense fallback={<Fallback height={48} />}>
        <Insights orderBy={orderBy} />
      </Suspense>
    </div>
  );
}
