'use client';

import { type ComboboxItem, Flex, Select } from '@mantine/core';
import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { addOrReplaceURLParams, ChartMetricsEnum, isParamInSearchParams, urlKeys } from '@/util/url-query-utils';
import { insightsChartAtom } from '@/app/atoms/insights-atoms';
import {
  InsightsColumnsOrderBy,
  InsightsColumnsGroupBy,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import getInsights, { type InsightsParams } from '../../insights/actions';
import Chart from './chart';

export default function ChartContainer(): React.ReactNode {
  const tInsights = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [insightsChart, setInsightsChart] = useAtom(insightsChartAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  // Chart parameters that will re-render only the chart when url state changes
  const [chartMetricValue, setChartMetricValue] = useState<string | null>(null);

  const resetInsightsChart = useCallback((): void => {
    setInsightsChart([]);
    setIsPending(true);
  }, [setInsightsChart]);

  useEffect(() => {
    // Logic to allow re-render only for search params of this component
    const currChartMetricValue = searchParams.get(urlKeys.chartMetric);
    if (chartMetricValue === currChartMetricValue) return;
    setChartMetricValue(currChartMetricValue);

    // Params
    const chartParams: InsightsParams = {
      orderBy: InsightsColumnsOrderBy.impressions_abs,
      pageSize: 3,
      groupedBy: [InsightsColumnsGroupBy.adId, InsightsColumnsGroupBy.publisher],
      order: OrderBy.desc,
      publisher: [
        PublisherEnum.Facebook,
        PublisherEnum.AudienceNetwork,
        PublisherEnum.GlobalAppBundle,
        PublisherEnum.Instagram,
        PublisherEnum.LinkedIn,
        PublisherEnum.Messenger,
        PublisherEnum.Pangle,
        PublisherEnum.TikTok,
        PublisherEnum.Unknown,
      ],
    };

    // Get chart's insights
    resetInsightsChart();
    void getInsights(chartParams)
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
  }, [chartMetricValue, resetInsightsChart, searchParams, setInsightsChart, tGeneric]);

  const getChartMetricValue = (): string => {
    if (isParamInSearchParams(searchParams, urlKeys.chartMetric, ChartMetricsEnum.SpentCPM))
      return ChartMetricsEnum.SpentCPM;
    else if (isParamInSearchParams(searchParams, urlKeys.chartMetric, ChartMetricsEnum.ImpressionsCPM))
      return ChartMetricsEnum.ImpressionsCPM;
    else if (isParamInSearchParams(searchParams, urlKeys.chartMetric, ChartMetricsEnum.Spent))
      return ChartMetricsEnum.Spent;
    return ChartMetricsEnum.Impressions;
  };

  const handleChartMetricChange = (value: string | null, option: ComboboxItem): void => {
    resetInsightsChart();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.chartMetric, option.value);
    startTransition(() => {
      router.replace(newURL, { scroll: false });
    });
  };

  return (
    <>
      <Flex align="center" gap="md" wrap="wrap">
        <Select
          description={tInsights('chartMetric')}
          data={[
            { value: ChartMetricsEnum.Impressions, label: tInsights('impressions') },
            { value: ChartMetricsEnum.Spent, label: tInsights('spent') },
            { value: ChartMetricsEnum.ImpressionsCPM, label: `${tInsights('impressions')} / CPM` },
            { value: ChartMetricsEnum.SpentCPM, label: `${tInsights('spent')} / CPM` },
          ]}
          defaultValue={ChartMetricsEnum.ImpressionsCPM}
          value={getChartMetricValue()}
          onChange={handleChartMetricChange}
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
          maw={200}
          disabled={isPending || !insightsChart.length}
        />
      </Flex>
      <Flex align="flex-end" gap="md" wrap="wrap" mb="md">
        <Chart insights={insightsChart} isPending={isPending} />
      </Flex>
    </>
  );
}