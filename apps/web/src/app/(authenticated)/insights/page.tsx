'use client';

import { type ReactNode, Suspense, useEffect, useState } from 'react';
import { Box, Flex } from '@mantine/core';
import { logger } from '@repo/logger';
import { useSetAtom } from 'jotai';
import { InsightsColumnsOrderBy, OrderBy } from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
import getInsights, { type SearchParams } from '@/app/(authenticated)/insights/actions';
import { hasNextInsightsPageAtom, insightsAtom } from '@/app/atoms/insights-atoms';
import InsightsGrid from './components/insights-grid';
import OrderFilters from './components/order-filters';
import PageControls from './components/page-controls';

interface InsightsProps {
  searchParams: SearchParams;
}

export default function Insights({ searchParams }: InsightsProps): ReactNode {
  const orderBy = searchParams.orderBy ?? InsightsColumnsOrderBy.impressions_abs;
  const order = searchParams.order ?? OrderBy.desc;
  // const search = searchParams.search;
  const pageSize = searchParams.pageSize;
  const page = searchParams.page;
  const setInsights = useSetAtom(insightsAtom);
  const setHasNextInsightsPage = useSetAtom(hasNextInsightsPageAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    setIsPending(false);
    setInsights([]);
    void getInsights(searchParams)
      .then((res) => {
        setInsights(res.insights.edges);
        setHasNextInsightsPage(res.insights.hasNext);
        setIsPending(true);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(true);
      });
  }, [order, orderBy, page, pageSize, searchParams, setHasNextInsightsPage, setInsights]);

  return (
    <Box pos="relative">
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
