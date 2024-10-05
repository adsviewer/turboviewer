'use client';

import { type ComboboxItem, Flex, Select, Title } from '@mantine/core';
import { useAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { startTransition, useCallback, useEffect, useState, type ReactNode } from 'react';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { insightsChartAtom, insightsTopAdsAtom } from '@/app/atoms/insights-atoms';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import InsightsGrid from '@/components/insights/insights-grid';
import { addOrReplaceURLParams, ChartMetricsEnum, isParamInSearchParams, urlKeys } from '@/util/url-query-utils';
import getInsights, { type InsightsParams } from '../insights/actions';
import Chart from './components/chart';
import Graphics from './components/graphics';

const INITIAL_ORDER_BY_VALUE = InsightsColumnsOrderBy.impressions_abs;
const TOP_ADS_INITIAL_PARAMS: InsightsParams = {
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
  ], // temporarily for ALL publishers, later we'll switch to a per integration logic once BE is done!
};

const CHART_INITIAL_PARAMS: InsightsParams = {
  orderBy: InsightsColumnsOrderBy.impressions_abs,
  groupedBy: [InsightsColumnsGroupBy.publisher],
  // dateTo: DateTime.now().toUnixInteger(),
  // dateFrom: DateTime.now().minus({ days: 28 }).toUnixInteger(),
  interval: InsightsInterval.day,
  order: OrderBy.desc,
  publisher: [PublisherEnum.Facebook],
};

export default function Summary(): ReactNode {
  const t = useTranslations('summary');
  const tInsights = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [insightsTopAds, setInsightsTopAds] = useAtom(insightsTopAdsAtom);
  const [insightsChart, setInsightsChart] = useAtom(insightsChartAtom);
  const [isPendingTopAds, setIsPendingTopAds] = useState<boolean>(false);
  const [isPendingChart, setIsPendingChart] = useState<boolean>(false);

  const resetInsightsTopAds = useCallback((): void => {
    setInsightsTopAds([]);
  }, [setInsightsTopAds]);

  const resetInsightsChart = useCallback((): void => {
    setInsightsChart([]);
  }, [setInsightsChart]);

  const getOrderByValue = (): string => {
    if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.impressions_rel))
      return InsightsColumnsOrderBy.impressions_rel;
    else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.spend_rel))
      return InsightsColumnsOrderBy.spend_rel;
    else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.spend_abs))
      return InsightsColumnsOrderBy.spend_abs;
    else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.cpm_rel))
      return InsightsColumnsOrderBy.cpm_rel;
    else if (isParamInSearchParams(searchParams, urlKeys.orderBy, InsightsColumnsOrderBy.cpm_abs))
      return InsightsColumnsOrderBy.cpm_abs;
    return INITIAL_ORDER_BY_VALUE; // default
  };

  const getChartMetricValue = (): string => {
    if (isParamInSearchParams(searchParams, urlKeys.chartMetric, ChartMetricsEnum.SpentCPM))
      return ChartMetricsEnum.SpentCPM;
    else if (isParamInSearchParams(searchParams, urlKeys.chartMetric, ChartMetricsEnum.ImpressionsCPM))
      return ChartMetricsEnum.ImpressionsCPM;
    else if (isParamInSearchParams(searchParams, urlKeys.chartMetric, ChartMetricsEnum.Spent))
      return ChartMetricsEnum.Spent;
    return ChartMetricsEnum.Impressions;
  };

  const handleOrderByChange = (value: string | null, option: ComboboxItem): void => {
    resetInsightsTopAds();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.orderBy, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleChartMetricChange = (value: string | null, option: ComboboxItem): void => {
    resetInsightsChart();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.chartMetric, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  useEffect(() => {
    const topAdsParams = { ...TOP_ADS_INITIAL_PARAMS };
    // const orderByValue = searchParams.get(urlKeys.orderBy);
    // topAdsParams.orderBy = orderByValue ? (orderByValue as InsightsColumnsOrderBy) : INITIAL_ORDER_BY_VALUE;
    resetInsightsTopAds();

    // Get top ads' insights
    setIsPendingTopAds(true);
    void getInsights(topAdsParams)
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
          return;
        }
        setInsightsTopAds(res.data.insights.edges);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPendingTopAds(false);
      });
  }, [resetInsightsTopAds, setInsightsTopAds, tGeneric]);

  useEffect(() => {
    resetInsightsChart();

    // Get chart's insights
    setIsPendingChart(true);
    void getInsights(CHART_INITIAL_PARAMS)
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
        setIsPendingChart(false);
      });
  }, [resetInsightsChart, setInsightsChart, tGeneric]);

  return (
    <Flex direction="column">
      <Graphics />
      {/* Chart */}
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
          disabled={isPendingChart || !insightsChart.length}
        />
      </Flex>
      <Flex align="flex-end" gap="md" wrap="wrap" mb="md">
        <Chart insights={insightsChart} isPending={isPendingChart} />
      </Flex>

      {/* Top Ads */}
      <Title mb="md" mt="xl">
        {t('topAds')}
      </Title>
      <Flex align="flex-end" gap="md" wrap="wrap" mb="lg">
        <Select
          description={tInsights('orderBy')}
          data={[
            { value: InsightsColumnsOrderBy.spend_rel, label: `${tInsights('spent')} (${tInsights('relative')})` },
            {
              value: InsightsColumnsOrderBy.impressions_rel,
              label: `${tInsights('impressions')} (${tInsights('relative')})`,
            },
            { value: InsightsColumnsOrderBy.cpm_rel, label: `CPM (${tInsights('relative')})` },
            { value: InsightsColumnsOrderBy.spend_abs, label: tInsights('spent') },
            { value: InsightsColumnsOrderBy.impressions_abs, label: tInsights('impressions') },
            { value: InsightsColumnsOrderBy.cpm_abs, label: 'CPM' },
          ]}
          value={getOrderByValue()}
          onChange={handleOrderByChange}
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
          maw={150}
          disabled={isPendingTopAds}
        />
      </Flex>
      <InsightsGrid insights={insightsTopAds} isPending={isPendingTopAds} />
    </Flex>
  );
}
