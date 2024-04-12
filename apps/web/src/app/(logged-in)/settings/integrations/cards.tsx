import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { type IntegrationsQuery } from '@/graphql/generated/schema-server';
import Card from '@/app/(logged-in)/settings/integrations/card';

interface CardsProps {
  integrations: IntegrationsQuery['integrations'];
}
export default function Cards({ integrations }: CardsProps): JSX.Element {
  return (
    // if you want super responsive replace grid with flex flex-wrap
    // and in card replace flex flex-col with flex-1 flex-shrink-1 flex-grow-1 min-w-96 max-w-[768px]
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <Suspense key={integration.type} fallback={<Fallback height={169} />}>
          <Card {...integration} />
        </Suspense>
      ))}
    </div>
  );
}
