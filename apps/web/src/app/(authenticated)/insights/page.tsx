'use client';

import { type ReactNode, Suspense, useEffect, useState } from 'react';
import { Box, Flex } from '@mantine/core';
import { logger } from '@repo/logger';
import { useSetAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { notifications } from '@mantine/notifications';
import LoaderCentered from '@/components/misc/loader-centered';
import getInsights, { type InsightsParams } from '@/app/(authenticated)/insights/actions';
import { hasNextInsightsPageAtom, insightsAtom } from '@/app/atoms/insights-atoms';
import LottieAnimation from '@/components/misc/lottie-animation';
import nodesGraphAnimation from '../../../../public/lotties/nodes-graph.json';
import InsightsGrid from './components/insights-grid';
import OrderFilters from './components/order-filters';
import PageControls from './components/page-controls';

interface InsightsProps {
  searchParams: InsightsParams;
}

export default function Insights(props: InsightsProps): ReactNode {
  const tGeneric = useTranslations('generic');
  const setInsights = useSetAtom(insightsAtom);
  const setHasNextInsightsPage = useSetAtom(hasNextInsightsPageAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    setIsPending(true);
    setInsights([]);
    void getInsights(props.searchParams)
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
        }

        if (res.data) {
          setInsights(res.data.insights.edges);
          setHasNextInsightsPage(res.data.insights.hasNext);
        }
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [props.searchParams, setHasNextInsightsPage, setInsights, tGeneric]);

  return (
    <Box pos="relative">
      <LottieAnimation
        animationData={nodesGraphAnimation}
        speed={0.2}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: -40,
          right: 34,
          zIndex: -9999,
          width: '18rem',
          opacity: 0.05,
        }}
      />
      <LottieAnimation
        animationData={nodesGraphAnimation}
        speed={0.3}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: 0,
          right: 170,
          zIndex: -9999,
          width: '19rem',
          transform: 'rotate(-140deg)',
          opacity: 0.08,
        }}
      />
      <OrderFilters />
      <Suspense fallback={<LoaderCentered type="dots" />}>
        <Flex direction="column">
          <InsightsGrid isPending={isPending} />
          <PageControls />
        </Flex>
      </Suspense>
    </Box>
  );
}
