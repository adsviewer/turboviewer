import { SimpleGrid } from '@mantine/core';
import { type Key, type ReactNode } from 'react';
import { useFormatter } from 'next-intl';
import { type InsightsQuery } from '@/graphql/generated/schema-server';
import InsightCard from './insight-card';

interface PropsType {
  insights: InsightsQuery['insights']['edges'];
}

export default function InsightsGrid(props: PropsType): ReactNode {
  const format = useFormatter();

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} style={{ display: 'relative' }}>
      {props.insights.length
        ? props.insights.map((insight) => (
            <InsightCard
              key={insight.id as Key}
              title={insight.publisher}
              description={insight.position}
              device={insight.device}
              rank="unknown"
              amountSpent={format.number(insight.spend, { style: 'currency', currency: insight.currency ?? 'EUR' })}
              currency={insight.currency}
              impressions={insight.impressions}
            />
          ))
        : null}
    </SimpleGrid>
  );
}
