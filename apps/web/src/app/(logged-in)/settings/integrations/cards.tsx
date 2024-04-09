import { type JSX } from 'react';
import { Card } from '@/app/(logged-in)/settings/integrations/card';
import { type IntegrationsQuery } from '@/graphql/generated/schema-server';

interface CardsProps {
  integrations: IntegrationsQuery['integrations'];
}
export default function Cards({ integrations }: CardsProps): JSX.Element {
  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <Card {...integration} key={integration.type} />
      ))}
    </div>
  );
}
