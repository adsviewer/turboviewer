'use client';

import { Text, SimpleGrid } from '@mantine/core';
import { type Key, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import LoaderCentered from '@/components/misc/loader-centered';
import { type GroupedInsight, type InsightsQuery } from '@/graphql/generated/schema-server';
import InsightCard from './insight-card';

interface PropsType {
  isPending: boolean;
  insights: InsightsQuery['insights']['edges'];
  hideCardHeadings?: boolean;
}

export default function InsightsGrid(props: PropsType): ReactNode {
  const t = useTranslations('insights');

  const getInsightHeading = (insight: GroupedInsight): string => {
    if (insight.publisher) return insight.publisher;
    else if (insight.integration) return insight.integration;
    return t('insight');
  };

  const getInsightTitle = (insight: GroupedInsight): string => {
    if (insight.creativeName) return insight.creativeName;
    else if (insight.adName) return insight.adName;
    return t('insight');
  };

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
          ? props.insights.map((insight, index) => (
              <motion.div
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                transition={{ type: 'spring', stiffness: 100, duration: 0.25, delay: index * 0.25 }}
                exit={{ opacity: 0 }}
                key={insight.id as Key}
              >
                <InsightCard
                  key={insight.id as Key}
                  heading={getInsightHeading(insight)}
                  title={getInsightTitle(insight)}
                  description={insight.position}
                  device={insight.device}
                  currency={insight.currency}
                  publisher={insight.publisher}
                  datapoints={insight.datapoints}
                  iframe={insight.iFrame}
                  hideHeading={props.hideCardHeadings}
                />
              </motion.div>
            ))
          : null}
      </SimpleGrid>
    </>
  );
}
