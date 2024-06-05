import React, { type JSX, Suspense } from 'react';
import { CardsCall, CardsNoCall } from '@/app/[locale]/(logged-in)/settings/integrations/cards-call';

export default function Page(): JSX.Element {
  return (
    <>
      <div className="text-lg font-semibold">Integrations with your favourite platforms</div>
      <div className="mt-1 text-sm text-gray-400">
        Supercharge your work and connect the tool you use every day to manage your advertisements.
      </div>
      <Suspense fallback={<CardsNoCall />}>
        <CardsCall />
      </Suspense>
    </>
  );
}
