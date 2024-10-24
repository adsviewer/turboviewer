'use client';

import { Flex } from '@mantine/core';
import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { type DateValue } from '@mantine/dates';
import { urlKeys } from '@/util/url-query-utils';
import { insightsChartAtom } from '@/app/atoms/insights-atoms';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import { type MultiSelectDataType } from '@/util/types';
import getInsights, { type InsightsParams } from '../../insights/actions';
import getAccounts from '../../actions';
import Chart from './chart';
import ChartFilters from './chart-filters';

export default function ChartContainer(): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const searchParams = useSearchParams();
  const [insightsChart, setInsightsChart] = useAtom(insightsChartAtom);
  const [accounts, setAccounts] = useState<MultiSelectDataType[]>([]);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [prevTopAdsOrderByValue, setPrevTopAdsOrderByValue] = useState<InsightsColumnsOrderBy | null>(
    () => searchParams.get(urlKeys.orderBy) as InsightsColumnsOrderBy | null,
  );
  // Date range values loading
  const paramsDateFrom = searchParams.get(urlKeys.dateFrom)
    ? (new Date(Number(searchParams.get(urlKeys.dateFrom))) as DateValue)
    : null;
  const paramsDateTo = searchParams.get(urlKeys.dateTo)
    ? (new Date(Number(searchParams.get(urlKeys.dateTo))) as DateValue)
    : null;
  const [dateRangeValue, setDateRangeValue] = useState<[DateValue, DateValue]>([paramsDateFrom, paramsDateTo]);

  const resetInsightsChart = useCallback((): void => {
    setInsightsChart([]);
    setIsPending(true);
  }, [setInsightsChart]);

  useEffect(() => {
    // Continue only when search params of this component are changed
    const currTopAdsOrderByValue = searchParams.get(urlKeys.orderBy);
    if (currTopAdsOrderByValue !== prevTopAdsOrderByValue) return;
    setPrevTopAdsOrderByValue(currTopAdsOrderByValue);

    const currSearchParamValue = searchParams.get(urlKeys.search);

    // Date Params
    let dateFrom, dateTo;
    if (searchParams.get(urlKeys.dateFrom) && searchParams.get(urlKeys.dateTo)) {
      dateFrom = Number(searchParams.get(urlKeys.dateFrom));
      dateTo = Number(searchParams.get(urlKeys.dateTo));
    }

    const CHART_PARAMS: InsightsParams = {
      adAccounts: searchParams.getAll(urlKeys.adAccount),
      dateFrom,
      dateTo,
      interval: InsightsInterval.day,
      orderBy: InsightsColumnsOrderBy.impressions_abs,
      pageSize: Object.keys(PublisherEnum).length, // page size is the same as the publishers that we manage since we group per publisher
      groupedBy: [InsightsColumnsGroupBy.publisher],
      order: OrderBy.desc,
      publisher: searchParams.getAll(urlKeys.publisher) as PublisherEnum[],
      search: currSearchParamValue ? currSearchParamValue : undefined,
    };

    // Get chart's insights
    resetInsightsChart();
    void getInsights(CHART_PARAMS)
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
          return;
        }
        setInsightsChart(res.data.insights.edges);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });

    // Get ad accounts for every integration!
    void getAccounts().then((res) => {
      const integrations = res.integrations;
      let adAccounts: MultiSelectDataType[] = [];
      for (const integration of integrations) {
        for (const adAccount of integration.adAccounts) {
          const newValue: MultiSelectDataType = {
            value: adAccount.id,
            label: adAccount.name,
          };
          adAccounts = [...adAccounts, newValue];
        }
      }
      setAccounts(adAccounts);
    });
  }, [prevTopAdsOrderByValue, resetInsightsChart, searchParams, setInsightsChart, tGeneric]);

  return (
    <Flex direction="column">
      <ChartFilters
        isPending={isPending}
        accounts={accounts}
        insightsChart={insightsChart}
        dateRangeValue={dateRangeValue}
        setDateRangeValue={setDateRangeValue}
        setIsPending={setIsPending}
        setInsightsChart={setInsightsChart}
        startTransition={startTransition}
        resetInsightsChart={resetInsightsChart}
      />
      <Flex align="flex-end" gap="md" wrap="wrap" mb="md">
        <Chart insights={insightsChart} isPending={isPending} />
      </Flex>
    </Flex>
  );
}
