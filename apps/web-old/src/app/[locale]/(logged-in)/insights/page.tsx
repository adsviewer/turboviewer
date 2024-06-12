import React, { Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { Insights } from '@/app/[locale]/(logged-in)/insights/insights';
import { type SearchParams } from '@/app/[locale]/(logged-in)/insights/query-string-util';
import InsightsNoCall from '@/app/[locale]/(logged-in)/insights/insights-no-call';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

interface InsightsProps {
  searchParams?: SearchParams;
}
export default function Page({ searchParams }: InsightsProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <Suspense
        fallback={
          <div>
            <InsightsNoCall
              insights={[]}
              page={1}
              hasNext={false}
              pageSize={12}
              orderBy={InsightsColumnsOrderBy.spend_rel}
              searchParams={searchParams}
            />
            <Fallback height={96} className="mt-40" />
          </div>
        }
      >
        <Insights searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
