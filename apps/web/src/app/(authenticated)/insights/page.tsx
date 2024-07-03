'use client';

import { type ReactNode, Suspense, useEffect, useState } from 'react';
import { Box, Flex, LoadingOverlay } from '@mantine/core';
import { useAtom } from 'jotai';
import { InsightsColumnsOrderBy, type InsightsQuery, OrderBy } from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
import { isInsightsLoadingAtom } from '@/app/atoms/loading-atoms';
import getInsights, { type SearchParams } from '@/app/(authenticated)/insights/actions';
import InsightsGrid from './components/insights-grid';
import OrderFilters from './components/order-filters';
import PageControls from './components/page-controls';

interface InsightsProps {
  searchParams: SearchParams;
}

export default function Insights({ searchParams }: InsightsProps): ReactNode {
  const orderBy = searchParams.orderBy ?? InsightsColumnsOrderBy.spend_rel;
  const order = searchParams.order ?? OrderBy.desc;
  const pageSize = parseInt(searchParams.pageSize ?? '12', 10);
  const page = parseInt(searchParams.page ?? '1', 10);
  const [isLoading, setIsLoading] = useAtom(isInsightsLoadingAtom);
  const [insights, setInsights] = useState<InsightsQuery['insights']['edges']>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    void getInsights(searchParams, orderBy, order, pageSize, page).then((res) => {
      setInsights(res.insights.edges);
      setHasNextPage(res.insights.hasNext);
      setIsLoading(false);
    });
  }, [order, orderBy, page, pageSize, searchParams, setIsLoading]);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />

      <OrderFilters />
      <Suspense fallback={<LoaderCentered type="dots" />}>
        <Flex direction="column">
          <InsightsGrid insights={insights} />
          <PageControls hasNextPage={hasNextPage} />
        </Flex>
      </Suspense>
    </Box>
  );
}
