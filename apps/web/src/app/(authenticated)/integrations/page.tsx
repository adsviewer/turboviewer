import { type ReactNode } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import IntegrationsGrid from './components/integrations-grid';

export default async function Integrations(): Promise<ReactNode> {
  const { settingsChannels } = await urqlClientSdk().settingsChannels();
  const metadata = (await urqlClientSdk().integrations()).integrations;

  return <IntegrationsGrid integrations={settingsChannels} metadata={metadata} />;
}
