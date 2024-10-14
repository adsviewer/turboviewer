'use client';

import { type ComboboxItem, Flex, MultiSelect, Select } from '@mantine/core';
import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { DatePickerInput, type DatesRangeValue, type DateValue } from '@mantine/dates';
import { IconCalendarMonth } from '@tabler/icons-react';
import _ from 'lodash';
import { addOrReplaceURLParams, ChartMetricsEnum, isParamInSearchParams, urlKeys } from '@/util/url-query-utils';
import { insightsChartAtom } from '@/app/atoms/insights-atoms';
import {
  InsightsColumnsOrderBy,
  InsightsColumnsGroupBy,
  OrderBy,
  PublisherEnum,
  InsightsInterval,
} from '@/graphql/generated/schema-server';
import { getPublisherCurrentValues, populatePublisherAvailableValues } from '@/util/insights-utils';
import Search from '@/components/search/search';
import getInsights, { type InsightsParams } from '../../insights/actions';
import Chart from './chart';

export default function ChartContainer(): React.ReactNode {
  const tInsights = useTranslations('insights');
  const tInsightsFilters = useTranslations('insights.filters');
  const tGeneric = useTranslations('generic');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [insightsChart, setInsightsChart] = useAtom(insightsChartAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  // Date range values loading
  const paramsDateFrom = searchParams.get(urlKeys.dateFrom)
    ? (new Date(Number(searchParams.get(urlKeys.dateFrom))) as DateValue)
    : null;
  const paramsDateTo = searchParams.get(urlKeys.dateTo)
    ? (new Date(Number(searchParams.get(urlKeys.dateTo))) as DateValue)
    : null;
  const [dateRangeValue, setDateRangeValue] = useState<[DateValue, DateValue]>([paramsDateFrom, paramsDateTo]);

  // Chart parameters that will re-render only the chart when url state changes
  const [chartMetricValue, setChartMetricValue] = useState<string | null>(null);
  const [dateFromValue, setDateFromValue] = useState<string | null>(null);
  const [dateToValue, setDateToValue] = useState<string | null>(null);
  const [publishersValue, setPublishersValue] = useState<string[] | null>(null);
  const [searchValue, setSearchValue] = useState<string | null>(null);

  const resetInsightsChart = useCallback((): void => {
    setInsightsChart([]);
    setIsPending(true);
  }, [setInsightsChart]);

  useEffect(() => {
    // Logic to allow re-render only for search params of this component
    const currChartMetricValue = searchParams.get(urlKeys.chartMetric);
    const currDateFromValue = searchParams.get(urlKeys.dateFrom);
    const currDateToValue = searchParams.get(urlKeys.dateTo);
    const currPublishersValue = searchParams.getAll(urlKeys.publisher);
    const currSearchValue = searchParams.get(urlKeys.search);
    if (
      chartMetricValue === currChartMetricValue &&
      dateFromValue === currDateFromValue &&
      dateToValue === currDateToValue &&
      _.isEqual(publishersValue, currPublishersValue) &&
      searchValue === currSearchValue
    )
      return;
    setChartMetricValue(currChartMetricValue);
    setDateFromValue(currDateFromValue);
    setDateToValue(currDateToValue);
    setPublishersValue(currPublishersValue);
    setSearchValue(currSearchValue);

    // Params
    let dateFrom, dateTo;
    if (dateRangeValue[0] && dateRangeValue[1]) {
      dateFrom = dateRangeValue[0].getTime();
      dateTo = dateRangeValue[1].getTime();
    }

    const chartParams: InsightsParams = {
      dateFrom,
      dateTo,
      interval: InsightsInterval.day,
      orderBy: InsightsColumnsOrderBy.impressions_abs,
      pageSize: Object.keys(PublisherEnum).length, // page size is the same as the publishers that we manage since we group per publisher
      groupedBy: [InsightsColumnsGroupBy.publisher],
      order: OrderBy.desc,
      publisher: searchParams.getAll(urlKeys.publisher) as PublisherEnum[],
      search: currSearchValue ? currSearchValue : undefined,
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
  }, [
    chartMetricValue,
    dateFromValue,
    dateRangeValue,
    dateToValue,
    publishersValue,
    resetInsightsChart,
    searchParams,
    searchValue,
    setInsightsChart,
    tGeneric,
  ]);

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

  const handleDateRangeChange = (dates: DatesRangeValue): void => {
    const newParams = new URLSearchParams(searchParams.toString());
    const dateFrom = dates[0];
    const dateTo = dates[1];
    setDateRangeValue([dateFrom, dateTo]);
    // Perform new fetching only if both dates are given
    if (dateFrom && dateTo) {
      newParams.set(urlKeys.dateFrom, String(dateFrom.getTime()));
      newParams.set(urlKeys.dateTo, String(dateTo.getTime()));
      const newURL = `${pathname}?${newParams.toString()}`;
      startTransition(() => {
        router.replace(newURL);
      });
    }
  };

  const handleMultiFilterAdd = (key: string, value: string): void => {
    resetInsightsChart();
    startTransition(() => {
      router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
    });
  };

  const handleMultiFilterRemove = (key: string, value: string): void => {
    resetInsightsChart();
    startTransition(() => {
      router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
    });
  };

  return (
    <Flex direction="column">
      <Flex align="center" gap="md" wrap="wrap" mb="md">
        <Search isPending={isPending} startTransition={startTransition} />
      </Flex>
      <Flex align="center" gap="md" wrap="wrap" mb="md">
        <Select
          description={tInsights('chartMetric')}
          disabled={isPending || !insightsChart.length}
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
          maw={280}
        />
        <MultiSelect
          description={tInsightsFilters('publishers')}
          disabled={isPending}
          placeholder={`${tInsightsFilters('selectPublishers')}...`}
          data={populatePublisherAvailableValues()}
          value={getPublisherCurrentValues(searchParams)}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(urlKeys.publisher, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(urlKeys.publisher, value);
          }}
          w={350}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
          my={4}
        />
        <DatePickerInput
          description={tGeneric('pickDateRange')}
          disabled={isPending}
          ml="auto"
          type="range"
          maxDate={new Date()}
          placeholder={tGeneric('pickDateRange')}
          leftSection={<IconCalendarMonth />}
          clearable={false}
          onChange={handleDateRangeChange}
          value={dateRangeValue}
        />
      </Flex>
      <Flex align="flex-end" gap="md" wrap="wrap" mb="md">
        <Chart insights={insightsChart} isPending={isPending} />
      </Flex>
    </Flex>
  );
}
