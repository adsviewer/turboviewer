'use client';

import { Text, SimpleGrid } from '@mantine/core';
import { type Key, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { type InsightsQuery } from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
import InsightCard from './insight-card';

interface PropsType {
  insights: InsightsQuery['insights']['edges'];
  isDataLoaded: boolean;
}

export default function InsightsGrid(props: PropsType): ReactNode {
  const t = useTranslations('insights');

  return (
    <>
      {/* Loading */}
      {!props.isDataLoaded ? <LoaderCentered type="dots" /> : null}

      {/* Empty insights data */}
      {props.isDataLoaded && !props.insights.length ? <Text>{t('noResultsFound')}</Text> : null}

      {/* Render insights */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} style={{ display: 'relative' }}>
        {props.insights.length
          ? props.insights.map((insight) => (
              <InsightCard
                key={insight.id as Key}
                title={insight.adName ? insight.adName : insight.publisher}
                description={insight.position}
                device={insight.device}
                currency={insight.currency}
                datapoints={insight.datapoints}
                iframe={insight.iFrame}
              />
            ))
          : null}
      </SimpleGrid>
    </>
  );
}
