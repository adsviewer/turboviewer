'use client';

import { Flex, Title } from '@mantine/core';
import { useSetAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { logger } from '@repo/logger';
import { insightsAtom } from '@/app/atoms/insights-atoms';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import InsightsGrid from '@/components/insights/insights-grid';
import getInsights, { type SearchParams } from '../insights/actions';

const TOP_ADS_PARAMS: SearchParams = {
  orderBy: InsightsColumnsOrderBy.impressions_abs,
  pageSize: 3,
  groupedBy: [InsightsColumnsGroupBy.adId],
  order: OrderBy.desc,
  publisher: PublisherEnum.Facebook,
};

export default function Summary(): ReactNode {
  const t = useTranslations('summary');
  const setInsights = useSetAtom(insightsAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    logger.info(TOP_ADS_PARAMS);
    setIsPending(true);
    setInsights([]);
    void getInsights(TOP_ADS_PARAMS)
      .then((res) => {
        setInsights(res.insights.edges);
        setIsPending(true);
        logger.info(res.insights.edges);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [setInsights]);

  return (
    <Flex direction="column">
      <Title mb="md">{t('topAds')}</Title>
      <InsightsGrid isPending={isPending} />
    </Flex>
  );
}
