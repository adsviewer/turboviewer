'use client';

import { type ComboboxItem, em, Flex, Select, Switch, Tooltip } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useState, useTransition } from 'react';
import { useAtom, useSetAtom } from 'jotai/index';
import { DatePickerInput, type DatesRangeValue, type DateValue } from '@mantine/dates';
import { IconCalendarMonth } from '@tabler/icons-react';
import { getTodayStartOfDay } from '@repo/utils';
import { logger } from '@repo/logger';
import { useMediaQuery } from '@mantine/hooks';
import {
  addOrReplaceURLParams,
  ChartMetricsEnum,
  isParamInSearchParams,
  OrderDirection,
  urlKeys,
} from '@/util/url-query-utils';
import { InsightsColumnsGroupBy, InsightsColumnsOrderBy, InsightsInterval } from '@/graphql/generated/schema-server';
import { hasNextInsightsPageAtom, insightsAtom } from '@/app/atoms/insights-atoms';
import { getOrderByValue } from '@/util/insights-utils';
import Search from '@/components/search/search';
import { convertFromUTC } from '@/util/mantine-utils';
import Thresholds from '@/components/thresholds/thresholds';
import { DEFAULT_INSIGHTS_PER_ROW, userDetailsAtom } from '@/app/atoms/user-atoms';
import { updatePreferences } from '../../actions';

export default function OrderFilters(): React.ReactNode {
  const t = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const [isPending, startTransition] = useTransition();
  const setInsights = useSetAtom(insightsAtom);
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  const setHasNextInsightsPageAtom = useSetAtom(hasNextInsightsPageAtom);

  // Date range values loading
  const paramsDateFrom = searchParams.get(urlKeys.dateFrom)
    ? (new Date(Number(searchParams.get(urlKeys.dateFrom))) as DateValue)
    : null;
  const paramsDateTo = searchParams.get(urlKeys.dateTo)
    ? (new Date(Number(searchParams.get(urlKeys.dateTo))) as DateValue)
    : null;
  const [dateRangeValue, setDateRangeValue] = useState<[DateValue, DateValue]>([paramsDateFrom, paramsDateTo]);

  const resetInsights = (): void => {
    setInsights([]);
    setHasNextInsightsPageAtom(false);
  };

  const getPageSizeValue = (): string => {
    if (isParamInSearchParams(searchParams, urlKeys.pageSize, searchParams.get(urlKeys.pageSize) ?? '12'))
      return searchParams.get(urlKeys.pageSize) ?? '12';
    return '12';
  };

  const getInsightsPerRowValue = (): string =>
    userDetails.preferences ? String(userDetails.preferences.insightsPerRow) : String(DEFAULT_INSIGHTS_PER_ROW);

  const getOrderDirectionValue = (): string => {
    if (isParamInSearchParams(searchParams, urlKeys.orderDirection, OrderDirection.asc)) return OrderDirection.asc;
    return OrderDirection.desc;
  };

  const getAdPreviewValue = (): boolean => {
    return isParamInSearchParams(searchParams, urlKeys.fetchPreviews, 'true');
  };

  const getIntervalValue = (): string => {
    if (isParamInSearchParams(searchParams, urlKeys.interval, InsightsInterval.month)) return InsightsInterval.month;
    else if (isParamInSearchParams(searchParams, urlKeys.interval, InsightsInterval.week)) return InsightsInterval.week;
    else if (isParamInSearchParams(searchParams, urlKeys.interval, InsightsInterval.quarter))
      return InsightsInterval.quarter;

    return InsightsInterval.day;
  };

  const getChartMetricValue = (): string => {
    if (isParamInSearchParams(searchParams, urlKeys.chartMetric, ChartMetricsEnum.SpentCPM))
      return ChartMetricsEnum.SpentCPM;
    return ChartMetricsEnum.ImpressionsCPM;
  };

  const handleChartMetricChange = (_value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.chartMetric, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handlePageSizeChange = (_value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.pageSize, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleInsightsPerRowChange = (_value: string | null, option: ComboboxItem): void => {
    if (userDetails.preferences) {
      const updatedUserDetails = {
        ...userDetails,
        preferences: {
          ...userDetails.preferences,
          insightsPerRow: Number(option.value),
        },
      };
      setUserDetails(updatedUserDetails);

      void updatePreferences({
        idToUpdate: userDetails.id,
        insightsPerRow: Number(option.value),
      }).catch((e: unknown) => {
        logger.error(e);
      });
    }
  };

  const handleOrderByChange = (_value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.orderBy, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleOrderDirectionChange = (_value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.orderDirection, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleIntervalChange = (_value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.interval, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleDateRangeChange = (dates: DatesRangeValue): void => {
    const newParams = new URLSearchParams(searchParams.toString());
    const dateFrom = dates[0];
    const dateTo = dates[1];
    setDateRangeValue([dateFrom, dateTo]);
    // Perform new fetching only if both dates are given
    if (dateFrom && dateTo) {
      resetInsights();
      newParams.set(urlKeys.dateFrom, String(getTodayStartOfDay(convertFromUTC(dateFrom)).getTime()));
      newParams.set(urlKeys.dateTo, String(getTodayStartOfDay(convertFromUTC(dateTo)).getTime()));
      const newURL = `${pathname}?${newParams.toString()}`;
      startTransition(() => {
        router.replace(newURL);
      });
    }
    // Clear logic
    else if (!dateFrom && !dateTo) {
      resetInsights();
      newParams.delete(urlKeys.dateFrom);
      newParams.delete(urlKeys.dateTo);
      const newURL = `${pathname}?${newParams.toString()}`;
      startTransition(() => {
        router.replace(newURL);
      });
    }
  };

  const handleAdPreviewChange = (e: ChangeEvent<HTMLInputElement>): void => {
    resetInsights();
    const newURL = e.target.checked
      ? addOrReplaceURLParams(pathname, searchParams, urlKeys.fetchPreviews, 'true')
      : addOrReplaceURLParams(pathname, searchParams, urlKeys.fetchPreviews);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  return (
    <Flex w="100%" wrap="wrap" direction="column" gap="md" mb="lg">
      <Flex wrap="wrap" align="center" gap="md">
        {/* Search */}
        <Search isPending={isPending} startTransition={startTransition} />
        {/* Thresholds */}
        <Thresholds isPending={isPending} startTransition={startTransition} />
        {/* Toggle ad previews */}
        <Tooltip
          withArrow
          label={t('adPreviewsTooltip')}
          refProp="rootRef"
          position="top-start"
          disabled={
            isPending ||
            (!isParamInSearchParams(searchParams, urlKeys.groupedBy, InsightsColumnsGroupBy.adId) &&
              !isParamInSearchParams(searchParams, urlKeys.groupedBy, InsightsColumnsGroupBy.creativeId))
          }
        >
          <Switch
            description={t('showAdPreviews')}
            checked={getAdPreviewValue()}
            onChange={handleAdPreviewChange}
            disabled={
              isPending ||
              (!isParamInSearchParams(searchParams, urlKeys.groupedBy, InsightsColumnsGroupBy.creativeId) &&
                !isParamInSearchParams(searchParams, urlKeys.groupedBy, InsightsColumnsGroupBy.adId))
            }
          />
        </Tooltip>
      </Flex>
      {/* Filters */}
      <Flex wrap="wrap" gap="md" align="center">
        {/* Page size filter */}
        <Flex align="flex-end" mr="sm">
          <Select
            description={t('pageSize')}
            placeholder="Pick value"
            data={['6', '12', '18', '50', '100']}
            value={getPageSizeValue()}
            onChange={handlePageSizeChange}
            allowDeselect={false}
            comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
            maw={90}
            scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
            disabled={isPending}
          />
        </Flex>

        {/* Insights per row setting */}
        {!isMobile ? (
          <Flex align="flex-end" mr="sm">
            <Select
              description={t('insightsPerRow')}
              styles={{
                description: {
                  whiteSpace: 'nowrap',
                },
              }}
              placeholder="Pick value"
              data={['3', '4', '5', '6']}
              value={getInsightsPerRowValue()}
              onChange={handleInsightsPerRowChange}
              allowDeselect={false}
              comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
              maw={90}
              scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
              disabled={isPending}
            />
          </Flex>
        ) : null}

        {/* Order filter */}
        <Flex align="flex-end" gap="md" wrap="wrap">
          <Select
            description={t('orderBy')}
            placeholder="Pick value"
            data={[
              {
                group: t('relative'),
                items: [
                  { value: InsightsColumnsOrderBy.spend_rel, label: `${t('spent')} (${t('relative')})` },
                  {
                    value: InsightsColumnsOrderBy.impressions_rel,
                    label: `${t('impressions')} (${t('relative')})`,
                  },
                  { value: InsightsColumnsOrderBy.clicks_rel, label: `Clicks (${t('relative')})` },
                  { value: InsightsColumnsOrderBy.cpm_rel, label: `CPM (${t('relative')})` },
                  { value: InsightsColumnsOrderBy.cpc_rel, label: `CPC (${t('relative')})` },
                ],
              },
              {
                group: t('absolute'),
                items: [
                  { value: InsightsColumnsOrderBy.spend_abs, label: t('spent') },
                  { value: InsightsColumnsOrderBy.impressions_abs, label: t('impressions') },
                  { value: InsightsColumnsOrderBy.clicks_abs, label: 'Clicks' },
                  { value: InsightsColumnsOrderBy.cpm_abs, label: 'CPM' },
                  { value: InsightsColumnsOrderBy.cpc_abs, label: 'CPC' },
                ],
              },
            ]}
            value={getOrderByValue(searchParams)}
            onChange={handleOrderByChange}
            allowDeselect={false}
            comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
            scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
            maw={280}
            disabled={isPending}
          />
          <Select
            placeholder="Pick value"
            data={[
              { value: OrderDirection.asc, label: t('ascending') },
              { value: OrderDirection.desc, label: t('descending') },
            ]}
            value={getOrderDirectionValue()}
            onChange={handleOrderDirectionChange}
            allowDeselect={false}
            comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
            scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
            maw={150}
            disabled={isPending}
          />

          <Flex align="flex-end" gap="md" wrap="wrap">
            <Flex gap="sm">
              <Select
                description={t('timeConstraints')}
                placeholder="Pick value"
                data={[
                  { value: InsightsInterval.day, label: t('daily') },
                  { value: InsightsInterval.week, label: t('weekly') },
                  { value: InsightsInterval.month, label: t('monthly') },
                  { value: InsightsInterval.quarter, label: t('quarterly') },
                ]}
                value={getIntervalValue()}
                onChange={handleIntervalChange}
                allowDeselect={false}
                comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
                scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
                maw={150}
                disabled={isPending}
              />
              <DatePickerInput
                description={tGeneric('pickDateRange')}
                mt="auto"
                type="range"
                maxDate={getTodayStartOfDay(convertFromUTC(new Date()))}
                placeholder={tGeneric('pickDateRange')}
                leftSection={<IconCalendarMonth />}
                clearable
                onChange={handleDateRangeChange}
                value={dateRangeValue}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {/* Misc. controls */}
      <Flex align="center" gap="md" wrap="wrap">
        {/* Change chart left metric */}
        {!getAdPreviewValue() ? (
          <Flex align="center" gap="md" wrap="wrap">
            <Select
              description={t('chartMetric')}
              placeholder="Pick value"
              data={[
                { value: ChartMetricsEnum.ImpressionsCPM, label: t('impressions') },
                { value: ChartMetricsEnum.SpentCPM, label: t('spent') },
              ]}
              defaultValue={ChartMetricsEnum.ImpressionsCPM}
              value={getChartMetricValue()}
              onChange={handleChartMetricChange}
              allowDeselect={false}
              comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
              scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
              maw={150}
              disabled={isPending}
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}
