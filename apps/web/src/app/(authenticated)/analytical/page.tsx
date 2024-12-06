'use client';

import { Flex, Text, Title } from '@mantine/core';
import React, { useEffect, type ReactNode, use, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import uniqid from 'uniqid';
import getInsights, { type InsightsParams } from '@/app/(authenticated)/insights/actions';
import { type GroupedInsight } from '@/graphql/generated/schema-server';
import InsightCard from '@/components/insights/insight-card';
import { getInsightHeading, getInsightTitle } from '@/util/insights-utils';

interface InsightsProps {
  searchParams: Promise<InsightsParams>;
}

export default function Analytical(props: InsightsProps): ReactNode {
  const tGeneric = useTranslations('generic');
  const t = useTranslations('insights');
  const searchParams = use(props.searchParams);
  const [insightData, setInsightData] = useState<GroupedInsight | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    setIsPending(true);
    void getInsights(searchParams)
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
          return;
        }
        if (res.data.insights.edges.length) setInsightData(res.data.insights.edges[0]);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [searchParams, tGeneric]);

  return (
    <Flex>
      {!isPending && insightData ? (
        <Flex direction="column" gap="lg" w="100%">
          <Title order={4}>{insightData.creativeName}</Title>
          <Flex justify="space-evenly">
            <InsightCard
              key={uniqid()}
              heading={getInsightHeading(insightData, t('insight'))}
              title={getInsightTitle(insightData, t('insight'))}
              description={insightData.position}
              device={insightData.device}
              currency={insightData.currency}
              publisher={insightData.publisher}
              datapoints={insightData.datapoints}
              iframe={insightData.iFrame}
              creativeName={insightData.creativeName}
              creativeId={insightData.creativeId}
            />
          </Flex>
        </Flex>
      ) : null}

      {/* No results found */}
      {!isPending && !insightData ? (
        <Text ta="center" c="dimmed" w="100%">
          {tGeneric('noResultsFound')}
        </Text>
      ) : null}
    </Flex>
  );
}
