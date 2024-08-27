import React, { type JSX, Suspense } from 'react';
import { type SettingsChannelsQuery, IntegrationStatus } from '@/graphql/generated/schema-server';
import Card from '@/app/[locale]/(logged-in)/settings/integrations/card';

interface CardsProps {
  integrations: SettingsChannelsQuery['settingsChannels'];
}
export default function Cards({ integrations }: CardsProps): JSX.Element {
  return (
    // if you want super responsive replace grid with flex flex-wrap
    // and in card replace flex flex-col with flex-1 flex-shrink-1 flex-grow-1 min-w-96 max-w-[768px]
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <Suspense
          key={integration.type}
          fallback={
            <Card __typename="IntegrationListItem" status={IntegrationStatus.ComingSoon} type={integration.type} />
          }
        >
          <Card {...integration} />
        </Suspense>
      ))}
    </div>
  );
}
