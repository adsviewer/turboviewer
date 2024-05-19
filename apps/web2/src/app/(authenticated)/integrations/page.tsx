import { Text } from '@mantine/core';
import { type ReactNode } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import IntegrationsGrid from './components/integrations-grid';

export default async function Integrations(): Promise<ReactNode> {
  const { settingsChannels } = await urqlClientSdk().settingsChannels();
  return (
    <>
      <h1>Integrations</h1>
      <Text mb="md">
        Supercharge your work and connect the tools you use every day to manage your advertisements in one place!
      </Text>
      <IntegrationsGrid integrations={settingsChannels} />
    </>
  );
}
