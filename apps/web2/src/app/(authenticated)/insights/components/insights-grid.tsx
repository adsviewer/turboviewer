import { Flex, SimpleGrid } from '@mantine/core';
import { type Key, type ReactNode } from 'react';
import { type InsightsQuery } from '@/graphql/generated/schema-server';
import InsightCard from './insight-card';
import PageControls from './page-controls';

interface PropsType {
  insights: InsightsQuery['insights']['edges'];
}

export default function InsightsGrid(props: PropsType): ReactNode {
  return (
    <Flex direction="column">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} style={{ display: 'relative' }}>
        {props.insights.length
          ? props.insights.map((insight, index) => (
              <InsightCard
                key={index as Key}
                title={insight.publisher}
                description={insight.position}
                device={insight.device}
                rank="good"
                currency={insight.currency}
                datapoints={insight.datapoints}
                iframe={insight.iFrame}
              />
            ))
          : null}
      </SimpleGrid>
      <PageControls />
    </Flex>
  );
}
