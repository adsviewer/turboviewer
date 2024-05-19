import { SimpleGrid } from '@mantine/core';
import { type ReactNode } from 'react';
import IntegrationCard from './integration-card';

export default function IntegrationsGrid(): ReactNode {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      <IntegrationCard
        title="Meta"
        description="Connect your Meta account and manage advertisments for every Meta Platforms application!"
        isConnected
      />
    </SimpleGrid>
  );
}
