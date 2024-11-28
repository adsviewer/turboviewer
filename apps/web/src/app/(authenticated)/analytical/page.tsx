'use client';

import { Flex } from '@mantine/core';
import React, { useEffect, type ReactNode, use, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import getInsights, { type InsightsParams } from '@/app/(authenticated)/insights/actions';

interface InsightsProps {
  searchParams: Promise<InsightsParams>;
}

export default function Analytical(props: InsightsProps): ReactNode {
  const tGeneric = useTranslations('generic');
  const searchParams = use(props.searchParams);
  const [insightData, setInsightData] = useState({});
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
      {String(JSON.stringify(insightData))} {isPending}
    </Flex>
  );
}
