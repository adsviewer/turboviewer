'use client';

import { type ComboboxItem, Flex, MultiSelect, Select } from '@mantine/core';
import { DatePickerInput, type DatesRangeValue, type DateValue } from '@mantine/dates';
import { getTodayStartOfDay } from '@repo/utils';
import { IconCalendarMonth } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { addOrReplaceURLParams, ChartMetricsEnum, urlKeys } from '@/util/url-query-utils';
import {
  populatePublisherAvailableValues,
  getPublisherCurrentValues,
  populateAccountsAvailableValues,
  getAccountCurrentValues,
} from '@/util/insights-utils';
import Search from '@/components/search/search';
import { type InsightsQuery } from '@/graphql/generated/schema-server';
import { type MultiSelectDataType } from '@/util/types';

interface PropsType {
  isPending: boolean;
  insightsChart: InsightsQuery['insights']['edges'];
  dateRangeValue: [DateValue, DateValue];
  accounts: MultiSelectDataType[];
  setDateRangeValue: (date: [DateValue, DateValue]) => void;
  setIsPending: (isPending: boolean) => void;
  setInsightsChart: (data: InsightsQuery['insights']['edges']) => void;
  startTransition: TransitionStartFunction;
  resetInsightsChart: () => void;
}

export default function ChartFilters(props: PropsType): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const tInsights = useTranslations('insights');
  const tInsightsFilters = useTranslations('insights.filters');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getChartMetricValue = (): string => {
    const chartMetric = searchParams.get(urlKeys.chartMetric)
      ? (searchParams.get(urlKeys.chartMetric) as ChartMetricsEnum)
      : ChartMetricsEnum.Impressions;
    return chartMetric;
  };

  const handleChartMetricChange = (value: string | null, option: ComboboxItem): void => {
    props.resetInsightsChart();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.chartMetric, option.value);
    startTransition(() => {
      router.replace(newURL, { scroll: false });
    });
  };

  const handleDateRangeChange = (dates: DatesRangeValue): void => {
    const newParams = new URLSearchParams(searchParams.toString());
    const dateFrom = dates[0];
    const dateTo = dates[1];
    props.setDateRangeValue([dateFrom, dateTo]);
    // Perform new fetching only if both dates are given
    if (dateFrom && dateTo) {
      newParams.set(urlKeys.dateFrom, String(getTodayStartOfDay(dateFrom).getTime()));
      newParams.set(urlKeys.dateTo, String(getTodayStartOfDay(dateTo).getTime()));
      const newURL = `${pathname}?${newParams.toString()}`;
      startTransition(() => {
        router.replace(newURL);
      });
    }
  };

  const handleMultiFilterAdd = (key: string, value: string): void => {
    props.resetInsightsChart();
    startTransition(() => {
      router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
    });
  };

  const handleMultiFilterRemove = (key: string, value: string): void => {
    props.resetInsightsChart();
    startTransition(() => {
      router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
    });
  };

  return (
    <>
      <Flex align="center" gap="md" wrap="wrap" mb="md">
        <Search isPending={props.isPending} startTransition={startTransition} />
      </Flex>
      <Flex align="center" gap="md" wrap="wrap" mb="md">
        <Select
          description={tInsights('chartMetric')}
          disabled={props.isPending || !props.insightsChart.length}
          data={[
            { value: ChartMetricsEnum.Impressions, label: tInsights('impressions') },
            { value: ChartMetricsEnum.Spent, label: tInsights('spent') },
            { value: ChartMetricsEnum.CPM, label: 'CPM' },
            { value: ChartMetricsEnum.CPC, label: 'CPC' },
          ]}
          defaultValue={ChartMetricsEnum.Impressions}
          value={getChartMetricValue()}
          onChange={handleChartMetricChange}
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
          maw={280}
        />
        <MultiSelect
          description={tInsightsFilters('publishers')}
          disabled={props.isPending}
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
        <MultiSelect
          description={tInsightsFilters('selectAccounts')}
          disabled={props.isPending || !props.accounts.length}
          searchable
          placeholder={`${tInsightsFilters('selectAccounts')}...`}
          data={populateAccountsAvailableValues(props.accounts)}
          value={getAccountCurrentValues(searchParams, props.accounts)}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(urlKeys.adAccount, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(urlKeys.adAccount, value);
          }}
          w={350}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
          styles={{ pill: { width: 200 } }}
        />
        <DatePickerInput
          description={tGeneric('pickDateRange')}
          disabled={props.isPending}
          ml="auto"
          type="range"
          maxDate={getTodayStartOfDay(new Date())}
          placeholder={tGeneric('pickDateRange')}
          leftSection={<IconCalendarMonth />}
          clearable={false}
          onChange={handleDateRangeChange}
          value={props.dateRangeValue}
        />
      </Flex>
    </>
  );
}
