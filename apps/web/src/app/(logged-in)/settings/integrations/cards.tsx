import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { type IntegrationsQuery } from '@/graphql/generated/schema-server';
import Card from '@/app/(logged-in)/settings/integrations/card';

interface CardsProps {
  integrations: IntegrationsQuery['integrations'];
}
export default function Cards({ integrations }: CardsProps): JSX.Element {
  return (
    <div className="mt-2 flex flex-wrap gap-6">
      {integrations.map((integration) => (
        <Suspense key={integration.type} fallback={<Fallback height={169} />}>
          <Card {...integration} />
        </Suspense>
      ))}
    </div>
  );
}
