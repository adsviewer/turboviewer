import { Text } from '@mantine/core';
import { type ReactNode } from 'react';
import IntegrationsGrid from './components/integrations-grid';

export default function Integrations(): ReactNode {
  return (
    <>
      <h1>Integrations</h1>
      <Text mb="md">
        Supercharge your work and connect the tools you use every day to manage your advertisements in one place!
      </Text>
      <IntegrationsGrid />
    </>
  );
}
