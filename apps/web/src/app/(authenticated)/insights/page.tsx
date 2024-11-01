'use client';

import { type ReactNode, Suspense, use, useEffect, useState } from 'react';
import { Box, Flex } from '@mantine/core';
import { logger } from '@repo/logger';
import { useAtom, useSetAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { notifications } from '@mantine/notifications';
import LoaderCentered from '@/components/misc/loader-centered';
import getInsights, { type InsightsParams } from '@/app/(authenticated)/insights/actions';
import { hasNextInsightsPageAtom, insightsAtom } from '@/app/atoms/insights-atoms';
import InsightsGrid from '../../../components/insights/insights-grid';
import OrderFilters from './components/order-filters';
import PageControls from './components/page-controls';
import Graphics from './components/graphics';

interface InsightsProps {
  searchParams: Promise<InsightsParams>;
}

// export default function Insights(props: { params: InsightsProps }): ReactNode {
export default function Insights(props: InsightsProps): ReactNode {
  const tGeneric = useTranslations('generic');
  const searchParams = use(props.searchParams);
  const [insights, setInsights] = useAtom(insightsAtom);
  const setHasNextInsightsPage = useSetAtom(hasNextInsightsPageAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    setIsPending(true);
    setInsights([]);
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
        setInsights(res.data.insights.edges);
        setHasNextInsightsPage(res.data.insights.hasNext);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [searchParams, setHasNextInsightsPage, setInsights, tGeneric]);

  return (
    <Box pos="relative">
      <Graphics />
      <OrderFilters />
      <Suspense fallback={<LoaderCentered type="dots" />}>
        <Flex direction="column">
          <InsightsGrid insights={insights} isPending={isPending} />
          <PageControls />
        </Flex>
      </Suspense>
    </Box>
  );
}
