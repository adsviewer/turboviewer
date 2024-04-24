import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { Insights } from '@/app/[locale]/(logged-in)/insights/insights';

export default function Page(): JSX.Element {
  return (
    <div>
      <Suspense fallback={<Fallback height={48} />}>
        <Insights />
      </Suspense>
    </div>
  );
}
