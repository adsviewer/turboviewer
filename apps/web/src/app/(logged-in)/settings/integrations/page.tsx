import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import Cards from '@/app/(logged-in)/settings/integrations/cards';

export default function Page(): JSX.Element {
  return (
    <>
      <div className="text-lg font-semibold">Integrations with your favourite platforms</div>
      <div className="mt-1 text-sm text-gray-400">
        Supercharge your work and connect the tool you use every day to manage your advertisements.
      </div>
      <Suspense fallback={<Fallback height={171} />}>
        <Cards />
      </Suspense>
    </>
  );
}
