import { type JSX } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { Card } from '@/app/(logged-in)/settings/integrations/card';

export default async function Cards(): Promise<JSX.Element> {
  const { integrations } = await urqlClientSdk().integrations();

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <Card {...integration} key={integration.type} />
      ))}
    </div>
  );
}
