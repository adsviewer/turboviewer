'use client';

import { Text, SimpleGrid, Transition } from '@mantine/core';
import { useEffect, useState, type Key, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { type InsightsQuery } from '@/graphql/generated/schema-server';
import InsightCard from './insight-card';

interface PropsType {
  insights: InsightsQuery['insights']['edges'];
}

export default function InsightsGrid(props: PropsType): ReactNode {
  const t = useTranslations('insights');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Refresh animation on insights data changes
  useEffect(() => {
    setIsMounted(false);
    setTimeout(() => {
      setIsMounted(true);
    }, 0);
  }, [props.insights]);

  return (
    <Transition mounted={isMounted} transition="fade" duration={400} timingFunction="ease">
      {(styles) => (
        <div style={styles}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} style={{ display: 'relative' }}>
            {props.insights.length ? (
              props.insights.map((insight) => (
                <InsightCard
                  key={insight.id as Key}
                  title={insight.publisher}
                  description={insight.position}
                  device={insight.device}
                  rank="good"
                  currency={insight.currency}
                  datapoints={insight.datapoints}
                  iframe={insight.iFrame}
                />
              ))
            ) : (
              <Text>{t('noResultsFound')}</Text>
            )}
          </SimpleGrid>
        </div>
      )}
    </Transition>
  );
}
