'use client';

import { Flex } from '@mantine/core';
import { type ReactNode } from 'react';
import Graphics from './components/graphics';
import ChartContainer from './components/chart-container';
import TopAdsContainer from './components/top-ads-container';

export default function Summary(): ReactNode {
  return (
    <Flex direction="column" gap={50}>
      <Graphics />
      <ChartContainer />
      <TopAdsContainer />
    </Flex>
  );
}
