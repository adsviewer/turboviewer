'use client';

import { Flex, Text, Select, type ComboboxItem, Switch, Tooltip } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, useTransition, useState } from 'react';
import { useSetAtom } from 'jotai/index';
import { DatePickerInput, type DateValue, type DatesRangeValue } from '@mantine/dates';
import { IconCalendarMonth } from '@tabler/icons-react';
import {
  OrderDirection,
  addOrReplaceURLParams,
  isParamInSearchParams,
  orderByKey,
  orderDirectionKey,
  pageSizeKey,
  fetchPreviewsKey,
  groupedByKey,
  intervalKey,
  dateFromKey,
  dateToKey,
} from '@/util/url-query-utils';
import { InsightsColumnsGroupBy, InsightsColumnsOrderBy, InsightsInterval } from '@/graphql/generated/schema-server';
import { hasNextInsightsPageAtom, insightsAtom } from '@/app/atoms/insights-atoms';

export default function OrderFilters(): React.ReactNode {
  const t = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const setInsights = useSetAtom(insightsAtom);
  const setHasNextInsightsPageAtom = useSetAtom(hasNextInsightsPageAtom);

  // Date range values loading
  const paramsDateFrom = searchParams.get(dateFromKey)
    ? (new Date(Number(searchParams.get(dateFromKey))) as DateValue)
    : null;
  const paramsDateTo = searchParams.get(dateToKey)
    ? (new Date(Number(searchParams.get(dateToKey))) as DateValue)
    : null;
  const [dateRangeValue, setDateRangeValue] = useState<[DateValue, DateValue]>([paramsDateFrom, paramsDateTo]);

  const resetInsights = (): void => {
    setInsights([]);
    setHasNextInsightsPageAtom(false);
  };

  const getPageSizeValue = (): string => {
    if (isParamInSearchParams(searchParams, pageSizeKey, searchParams.get(pageSizeKey) ?? '12')) {
      return searchParams.get(pageSizeKey) ?? '12';
    }
    return '12';
  };

  const getOrderDirectionValue = (): string => {
    if (isParamInSearchParams(searchParams, orderDirectionKey, OrderDirection.asc)) {
      return OrderDirection.asc;
    }
    return OrderDirection.desc;
  };

  const getAdPreviewValue = (): boolean => {
    return isParamInSearchParams(searchParams, fetchPreviewsKey, 'true');
  };

  const getOrderByValue = (): string => {
    if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.impressions_rel)) {
      return InsightsColumnsOrderBy.impressions_rel;
    } else if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.spend_rel)) {
      return InsightsColumnsOrderBy.spend_rel;
    } else if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.spend_abs)) {
      return InsightsColumnsOrderBy.spend_abs;
    } else if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.cpm_rel)) {
      return InsightsColumnsOrderBy.cpm_rel;
    } else if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.cpm_abs)) {
      return InsightsColumnsOrderBy.cpm_abs;
    }
    return InsightsColumnsOrderBy.impressions_abs; // default
  };

  const getIntervalValue = (): string => {
    if (isParamInSearchParams(searchParams, intervalKey, InsightsInterval.month)) {
      return InsightsInterval.month;
    } else if (isParamInSearchParams(searchParams, intervalKey, InsightsInterval.week)) {
      return InsightsInterval.week;
    } else if (isParamInSearchParams(searchParams, intervalKey, InsightsInterval.quarter)) {
      return InsightsInterval.quarter;
    }
    return InsightsInterval.day;
  };

  const handlePageSizeChange = (value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, pageSizeKey, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleOrderByChange = (value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, orderByKey, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleOrderDirectionChange = (value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, orderDirectionKey, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };

  const handleIntervalChange = (value: string | null, option: ComboboxItem): void => {
    resetInsights();
    const newURL = addOrReplaceURLParams(pathname, searchParams, intervalKey, option.value);
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
      newParams.set(dateFromKey, String(dateFrom.getTime()));
      newParams.set(dateToKey, String(dateTo.getTime()));
      const newURL = `${pathname}?${newParams.toString()}`;
      startTransition(() => {
        router.replace(newURL);
      });
    }
    // Clear logic
    else if (!dateFrom && !dateTo) {
      resetInsights();
      newParams.delete(dateFromKey);
      newParams.delete(dateToKey);
      const newURL = `${pathname}?${newParams.toString()}`;
      startTransition(() => {
        router.replace(newURL);
      });
    }
  };

  const handleAdPreviewChange = (e: ChangeEvent<HTMLInputElement>): void => {
    resetInsights();
    let newURL: string;
    if (e.target.checked) {
      newURL = addOrReplaceURLParams(pathname, searchParams, fetchPreviewsKey, 'true');
    } else {
      newURL = addOrReplaceURLParams(pathname, searchParams, fetchPreviewsKey);
    }
    startTransition(() => {
      router.replace(newURL);
    });
  };

  return (
    <Flex w="100%" wrap="wrap" direction="column">
      {/* Filters */}
      <Flex wrap="wrap" mb="md" gap="xs">
        {/* Page size filter */}
        <Flex align="center" mr="sm">
          <Text size="md" mr="sm">
            {t('pageSize')}:
          </Text>
          <Select
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

        {/* Order filter */}
        <Flex align="center" gap="md" wrap="wrap">
          <Text size="md">{t('orderBy')}:</Text>
          <Select
            placeholder="Pick value"
            data={[
              { value: InsightsColumnsOrderBy.spend_rel, label: `${t('spent')} (${t('relative')})` },
              { value: InsightsColumnsOrderBy.impressions_rel, label: `${t('impressions')} (${t('relative')})` },
              { value: InsightsColumnsOrderBy.cpm_rel, label: `CPM (${t('relative')})` },
              { value: InsightsColumnsOrderBy.spend_abs, label: t('spent') },
              { value: InsightsColumnsOrderBy.impressions_abs, label: t('impressions') },
              { value: InsightsColumnsOrderBy.cpm_abs, label: 'CPM' },
            ]}
            value={getOrderByValue()}
            onChange={handleOrderByChange}
            allowDeselect={false}
            comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
            scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
            maw={150}
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

          <Flex align="center" gap="md" wrap="wrap">
            <Text size="md">{t('timeConstraints')}:</Text>
            <Flex gap="sm">
              <Select
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
                type="range"
                maxDate={new Date()}
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
      <Flex align="center" gap="md" mb="md">
        {/* Toggle ad previews */}
        <Tooltip
          withArrow
          label={t('adPreviewsTooltip')}
          refProp="rootRef"
          position="top-start"
          disabled={!isPending && isParamInSearchParams(searchParams, groupedByKey, InsightsColumnsGroupBy.adId)}
        >
          <Switch
            label={t('showAdPreviews')}
            checked={getAdPreviewValue()}
            onChange={handleAdPreviewChange}
            disabled={isPending || !isParamInSearchParams(searchParams, groupedByKey, InsightsColumnsGroupBy.adId)}
          />
        </Tooltip>
      </Flex>
    </Flex>
  );
}
