'use client';

import { Flex, Title } from '@mantine/core';
import { useSetAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { insightsAtom } from '@/app/atoms/insights-atoms';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import InsightsGrid from '@/components/insights/insights-grid';
import getInsights, { type InsightsParams } from '../insights/actions';

const TOP_ADS_INITIAL_PARAMS: InsightsParams = {
  orderBy: InsightsColumnsOrderBy.impressions_abs,
  pageSize: 3,
  groupedBy: [InsightsColumnsGroupBy.adId],
  order: OrderBy.desc,
  publisher: PublisherEnum.Facebook,
};

export default function Summary(): ReactNode {
  const t = useTranslations('summary');
  const tGeneric = useTranslations('generic');
  const setInsights = useSetAtom(insightsAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    const topAdsParams = { ...TOP_ADS_INITIAL_PARAMS };

    setIsPending(true);
    setInsights([]);
    void getInsights(topAdsParams)
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
        }
        if (res.data) setInsights(res.data.insights.edges);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [setInsights, tGeneric]);

  return (
    <Flex direction="column">
      <Title mb="md">{t('topAds')}</Title>
      <InsightsGrid isPending={isPending} />
    </Flex>
  );
}
