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
import { getTodayStartOfDay } from '@repo/utils';
import { addOrReplaceURLParams, ChartMetricsEnum, urlKeys } from '@/util/url-query-utils';
import { insightsChartAtom } from '@/app/atoms/insights-atoms';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import {
  getAccountCurrentValues,
  getPublisherCurrentValues,
  populateAccountsAvailableValues,
  populatePublisherAvailableValues,
} from '@/util/insights-utils';
import Search from '@/components/search/search';
import { type MultiSelectDataType } from '@/util/types';
import getInsights, { type InsightsParams } from '../../insights/actions';
import getAccounts from '../../actions';
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
  const [accounts, setAccounts] = useState<MultiSelectDataType[]>([]);
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

    // Accounts
    // Get ad account for every integration!
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

  const getChartMetricValue = (): string => {
    const chartMetric = searchParams.get(urlKeys.chartMetric)
      ? (searchParams.get(urlKeys.chartMetric) as ChartMetricsEnum)
      : ChartMetricsEnum.Impressions;
    return chartMetric;
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
      newParams.set(urlKeys.dateFrom, String(getTodayStartOfDay(dateFrom).getTime()));
      newParams.set(urlKeys.dateTo, String(getTodayStartOfDay(dateTo).getTime()));
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
            { value: ChartMetricsEnum.CPM, label: 'CPM' },
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
        <MultiSelect
          description={tInsightsFilters('selectAccounts')}
          disabled={isPending}
          searchable
          placeholder={`${tInsightsFilters('selectAccounts')}...`}
          data={populateAccountsAvailableValues(accounts)}
          value={getAccountCurrentValues(searchParams, accounts)}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(urlKeys.account, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(urlKeys.account, value);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
          styles={{ pill: { width: 200 } }}
        />
        <DatePickerInput
          description={tGeneric('pickDateRange')}
          disabled={isPending}
          ml="auto"
          type="range"
          maxDate={getTodayStartOfDay(new Date())}
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
