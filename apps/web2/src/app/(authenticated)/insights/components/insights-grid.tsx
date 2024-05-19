import { SimpleGrid } from '@mantine/core';
import { type ReactNode } from 'react';
import { CurrencyEnum, DeviceEnum, PublisherEnum } from '@/graphql/generated/schema-server';
import InsightCard from './insight-card';

export default function InsightsGrid(): ReactNode {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      <InsightCard
        publisher={PublisherEnum.Facebook}
        position="Facebook Reels"
        device={DeviceEnum.Desktop}
        rank="mid"
        amountSpent="25.58"
        currency={CurrencyEnum.EUR}
        impressions={11274}
      />
    </SimpleGrid>
  );
}
