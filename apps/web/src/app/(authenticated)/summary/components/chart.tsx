'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { AreaChart, type ChartData, type AreaChartSeries } from '@mantine/charts';
import { Flex, LoadingOverlay } from '@mantine/core';
import { getCurrencySymbol } from '@/util/currency-utils';
import { ChartMetricsEnum, urlKeys } from '@/util/url-query-utils';
import { CurrencyEnum, type PublisherEnum, type InsightsQuery } from '@/graphql/generated/schema-server';
import { dateFormatOptions } from '@/util/format-utils';
import { placeholderDatapoints, placeholderSeries } from '@/util/charts-utils';
import { getColor } from '@/util/color-utils';

interface PropsType {
  isPending: boolean;
  insights: InsightsQuery['insights']['edges'];
}

interface AggregatedDataPoint {
  date: string;
  [key: string]: unknown; // Allows for dynamic publisher-specific properties (e.g., impressions-publisher)
}

export default function Chart(props: PropsType): ReactNode {
  const tInsights = useTranslations('insights');
  const format = useFormatter();
  const searchParams = useSearchParams();
  const [datapoints, setDatapoints] = useState<unknown[]>([]);
  const [publishers, setPublishers] = useState<PublisherEnum[]>([]);
  const [currency, setCurrency] = useState<CurrencyEnum>(CurrencyEnum.USD);

  const setupDatapoints = useCallback(() => {
    if (props.insights.length) {
      setCurrency(props.insights[0].currency); // TEMPORARY SOLUTION
      // An object to hold the accumulated values
      const aggregatedData: AggregatedDataPoint[] = [];
      const uniquePublishersSet = new Set();

      for (const insight of props.insights) {
        if (insight.publisher) {
          const publisher = insight.publisher;
          uniquePublishersSet.add(publisher);

          // Map datapoints for the current publisher
          const perPublisherDatapoints = insight.datapoints.map((datapoint) => ({
            [`impressions-${publisher}`]: datapoint.impressions,
            date: format.dateTime(new Date(datapoint.date), dateFormatOptions),
            [`spend-${publisher}`]: Math.floor(Number(datapoint.spend) / 100),
            [`cpm-${publisher}`]: datapoint.cpm ?? 0n,
          }));

          // Update the aggregatedData with the current publisher's datapoints
          perPublisherDatapoints.forEach((datapoint) => {
            const { date } = datapoint;
            const existingEntry = aggregatedData.find((data) => data.date === date);

            // If an entry for the same date exists, merge the current datapoint, else create it
            if (existingEntry) Object.assign(existingEntry, datapoint);
            else aggregatedData.push(datapoint);
          });
        }
      }

      // At the end, aggregatedData will contain all the publishers' datapoints grouped by date
      setDatapoints([...aggregatedData]);
      setPublishers(Array.from(uniquePublishersSet) as PublisherEnum[]);
    }
  }, [format, props.insights]);

  useEffect(() => {
    setupDatapoints();
  }, [setupDatapoints]);

  const getChartSeries = (): AreaChartSeries[] => {
    // Figure out how many series (lines) we want, based on the amount of publishers that have datapoints
    let impressionsSeries: AreaChartSeries[] = [];
    let spendSeries: AreaChartSeries[] = [];
    let cpmSeries: AreaChartSeries[] = [];

    for (const [index, publisher] of publishers.entries()) {
      const impressionSerieData = {
        yAxisId: 'left',
        name: `impressions-${publisher}`,
        color: getColor(index),
        label: publisher,
      };
      const spendSerieData = {
        yAxisId: 'left',
        name: `spend-${publisher}`,
        color: getColor(index),
        label: `${publisher} (${getCurrencySymbol(currency)})`,
      };
      const cpmSerieData = { yAxisId: 'left', name: `cpm-${publisher}`, color: getColor(index), label: publisher };
      impressionsSeries = [...impressionsSeries, impressionSerieData];
      spendSeries = [...spendSeries, spendSerieData];
      cpmSeries = [...cpmSeries, cpmSerieData];
    }

    switch (searchParams.get(urlKeys.chartMetric)) {
      case ChartMetricsEnum.CPM:
        return cpmSeries;
      case ChartMetricsEnum.Spent:
        return spendSeries;
      default:
        return impressionsSeries;
    }
  };

  return (
    <>
      {/* Chart w/ loading state */}
      {props.isPending || !props.insights.length ? (
        <Flex pos="relative" justify="center" align="center" w="100%" mih={120}>
          <LoadingOverlay
            visible
            zIndex={1}
            overlayProps={{ blur: 4 }}
            color="#FFF"
            loaderProps={!props.isPending ? { children: tInsights('noResultsFound'), c: 'dimmed' } : {}}
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
            series={placeholderSeries}
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
          data={datapoints as ChartData}
          series={getChartSeries()}
        />
      )}
    </>
  );
}
