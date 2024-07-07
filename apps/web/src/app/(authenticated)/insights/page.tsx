'use client';

import { type ReactNode, Suspense, useEffect, useState } from 'react';
import { Box, Flex } from '@mantine/core';
import { InsightsColumnsOrderBy, type InsightsQuery, OrderBy } from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';
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
  const [insights, setInsights] = useState<InsightsQuery['insights']['edges']>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  useEffect(() => {
    void getInsights(searchParams, orderBy, order, pageSize, page).then((res) => {
      setInsights(res.insights.edges);
      setHasNextPage(res.insights.hasNext);
    });
  }, [order, orderBy, page, pageSize, searchParams]);

  return (
    <Box pos="relative">
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
