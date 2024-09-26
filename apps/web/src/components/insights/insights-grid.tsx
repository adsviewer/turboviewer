'use client';

import { Text, SimpleGrid } from '@mantine/core';
import { type Key, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import LoaderCentered from '@/components/misc/loader-centered';
import { type InsightsQuery } from '@/graphql/generated/schema-server';
import InsightCard from './insight-card';

interface PropsType {
  isPending: boolean;
  insights: InsightsQuery['insights']['edges'];
}

export default function InsightsGrid(props: PropsType): ReactNode {
  const t = useTranslations('insights');

  return (
    <>
      {/* Loading */}
      {props.isPending ? <LoaderCentered type="dots" /> : null}

      {/* Empty insights data */}
      {!props.isPending && !props.insights.length ? (
        <Text c="dimmed" ta="center">
          {t('noResultsFound')}
        </Text>
      ) : null}

      {/* Render insights */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} style={{ display: 'relative' }}>
        {props.insights.length
          ? props.insights.map((insight) => (
              <InsightCard
                key={insight.id as Key}
                heading={insight.publisher ?? t('insight')}
                title={insight.adName ?? t('insight')}
                description={insight.position}
                device={insight.device}
                currency={insight.currency}
                publisher={insight.publisher}
                datapoints={insight.datapoints}
                iframe={insight.iFrame}
              />
            ))
          : null}
      </SimpleGrid>
    </>
  );
}
