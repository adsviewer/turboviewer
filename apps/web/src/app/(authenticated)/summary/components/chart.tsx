'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AreaChart, type AreaChartSeries } from '@mantine/charts';
import { Flex, LoadingOverlay } from '@mantine/core';
import { getCurrencySymbol } from '@/util/currency-utils';
import { ChartMetricsEnum, urlKeys } from '@/util/url-query-utils';
import { CurrencyEnum, type InsightsQuery } from '@/graphql/generated/schema-server';
import { dateFormatOptions } from '@/util/format-utils';
import { placeholderDatapoints } from '@/util/charts-utils';

interface PropsType {
  isPending: boolean;
  insights: InsightsQuery['insights']['edges'];
}

interface Datapoint {
  date: string;
  impressions: bigint;
  spend: number;
  cpm: bigint;
}

export default function Chart(props: PropsType): ReactNode {
  const tInsights = useTranslations('insights');
  const format = useFormatter();
  const searchParams = useSearchParams();
  const [datapoints, setDatapoints] = useState<Datapoint[]>([]);
  const [currency, setCurrency] = useState<CurrencyEnum>(CurrencyEnum.USD);

  const setupDatapoints = useCallback(() => {
    if (props.insights.length) {
      const newDatapoints = props.insights.map((insight) => insight.datapoints).flat();
      const formattedDatapoints = [];
      setCurrency(props.insights[0].currency); // TEMPORARY SOLUTION
      for (const datapoint of newDatapoints) {
        formattedDatapoints.push({
          date: format.dateTime(new Date(datapoint.date), dateFormatOptions),
          impressions: datapoint.impressions,
          spend: Math.floor(Number(datapoint.spend) / 100),
          cpm: datapoint.cpm ?? 0n,
        });
      }
      setDatapoints(formattedDatapoints);
    }
  }, [format, props.insights]);

  useEffect(() => {
    setupDatapoints();
  }, [setupDatapoints]);

  const getChartSeries = (): AreaChartSeries[] => {
    switch (searchParams.get(urlKeys.chartMetric)) {
      case ChartMetricsEnum.SpentCPM:
        return [
          {
            yAxisId: 'left',
            name: 'spend',
            color: 'teal.6',
            label: `${tInsights('spent')} (${getCurrencySymbol(currency)})`,
          },
          { yAxisId: 'right', name: 'cpm', color: 'orange', label: 'CPM' },
        ];
      case ChartMetricsEnum.ImpressionsCPM:
        return [
          { yAxisId: 'left', name: 'impressions', color: 'blue.6', label: tInsights('impressions') },
          { yAxisId: 'right', name: 'cpm', color: 'orange', label: 'CPM' },
        ];
      case ChartMetricsEnum.Spent:
        return [
          {
            yAxisId: 'left',
            name: 'spend',
            color: 'teal.6',
            label: `${tInsights('spent')} (${getCurrencySymbol(currency)})`,
          },
        ];
      default:
        return [{ yAxisId: 'left', name: 'impressions', color: 'blue.6', label: tInsights('impressions') }];
    }
  };

  return (
    <>
      {/* Chart w/ loading state */}
      {props.isPending || !props.insights.length ? (
        <Flex pos="relative" justify="center" align="center" w="100%" mih={120}>
          <LoadingOverlay
            visible
            overlayProps={{ blur: 4 }}
            color="#FFF"
            loaderProps={!props.isPending ? { children: tInsights('noResultsFound') } : {}}
          />
          <AreaChart
            h={300}
            mx="md"
            tooltipProps={{ wrapperStyle: { zIndex: 10 } }}
            curveType="natural"
            strokeWidth={1.5}
            tooltipAnimationDuration={200}
            withLegend
            withRightYAxis
            valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
            dataKey="date"
            data={placeholderDatapoints}
            series={[
              { yAxisId: 'left', name: 'impressions', color: 'blue.6', label: tInsights('impressions') },
              { yAxisId: 'right', name: 'cpm', color: 'orange', label: 'CPM' },
            ]}
          />
        </Flex>
      ) : (
        <AreaChart
          h={300}
          mx="md"
          tooltipProps={{ wrapperStyle: { zIndex: 10 } }}
          curveType="natural"
          strokeWidth={1.5}
          tooltipAnimationDuration={200}
          withLegend
          withRightYAxis
          valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
          dataKey="date"
          data={datapoints}
          series={getChartSeries()}
        />
      )}
    </>
  );
}
