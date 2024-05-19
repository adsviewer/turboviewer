import { SimpleGrid } from '@mantine/core';
import { type ReactNode } from 'react';
import { type InsightsQuery } from '@/graphql/generated/schema-server';
import InsightCard from './insight-card';

interface PropsType {
  insights: InsightsQuery['insights']['edges'];
}

export default function InsightsGrid(props: PropsType): ReactNode {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} style={{ display: 'relative' }}>
      {props.insights.length
        ? props.insights.map((insight) => (
            <InsightCard
              key={insight.adId}
              title={insight.publisher}
              description={insight.position}
              device={insight.device}
              rank="unknown"
              amountSpent={insight.spend}
              currency={insight.currency}
              impressions={insight.impressions}
            />
          ))
        : null}
    </SimpleGrid>
  );
}
