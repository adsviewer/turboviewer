'use client';

import { Title, Flex, Select, Text, type ComboboxItem } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import uniqid from 'uniqid';
import { urlKeys, addOrReplaceURLParams, type ChartMetricsEnum } from '@/util/url-query-utils';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  type InsightsQuery,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import { insightsTopAdsAtom } from '@/app/atoms/insights-atoms';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import InsightsGrid from '@/components/insights/insights-grid';
import { type UrqlResult } from '@/util/handle-urql-request';
import LoaderCentered from '@/components/misc/loader-centered';
import { getOrderByValue } from '@/util/insights-utils';
import getInsights, { type InsightsParams } from '../../insights/actions';

export default function TopAdsContainer(): React.ReactNode {
  const t = useTranslations('summary');
  const tGeneric = useTranslations('generic');
  const tInsights = useTranslations('insights');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [insightsTopAds, setInsightsTopAds] = useAtom(insightsTopAdsAtom);
  const userDetails = useAtomValue(userDetailsAtom);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [prevChartMetricValue, setPrevChartMetricValue] = useState<ChartMetricsEnum | null>(
    () => searchParams.get(urlKeys.chartMetric) as ChartMetricsEnum | null,
  );

  const resetInsightsTopAds = useCallback((): void => {
    setInsightsTopAds([]);
    setIsPending(true);
  }, [setInsightsTopAds]);

  useEffect(() => {
    // Continue only when search params of this component are changed
    const currChartMetricValue = searchParams.get(urlKeys.chartMetric);
    if (currChartMetricValue !== prevChartMetricValue) return;
    setPrevChartMetricValue(currChartMetricValue);

    const currOrderByValue = searchParams.get(urlKeys.orderBy)
      ? (searchParams.get(urlKeys.orderBy) as InsightsColumnsOrderBy)
      : InsightsColumnsOrderBy.impressions_abs;

    const paramsPublishers = searchParams.getAll(urlKeys.publisher).length
      ? (searchParams.getAll(urlKeys.publisher) as PublisherEnum[])
      : Object.values(PublisherEnum);
    const paramsSearchValue = searchParams.get(urlKeys.search);

    // Date Params
    let dateFrom, dateTo;
    if (searchParams.get(urlKeys.dateFrom) && searchParams.get(urlKeys.dateTo)) {
      dateFrom = Number(searchParams.get(urlKeys.dateFrom));
      dateTo = Number(searchParams.get(urlKeys.dateTo));
    }

    // Get top ads' insights
    // Perform a request for each integration that the user has
    if (userDetails.currentOrganization) {
      resetInsightsTopAds();
      const allRequests: Promise<UrqlResult<InsightsQuery> | null>[] = [];
      for (const publisher of paramsPublishers) {
        const TOP_ADS_PARAMS: InsightsParams = {
          adAccounts: searchParams.getAll(urlKeys.adAccount),
          dateFrom,
          dateTo,
          orderBy: currOrderByValue,
          order: getCorrectOrder(currOrderByValue),
          pageSize: 3,
          interval: InsightsInterval.week,
          groupedBy: [InsightsColumnsGroupBy.adId, InsightsColumnsGroupBy.publisher],
          publisher: [publisher],
          search: paramsSearchValue ? paramsSearchValue : undefined,
        };

        const request = getInsights(TOP_ADS_PARAMS)
          .then((res) => {
            if (!res.success) {
              notifications.show({
                title: tGeneric('error'),
                message: String(res.error),
                color: 'red',
              });
              return null;
            }
            return res;
          })
          .catch((error: unknown) => {
            logger.error(error);
            return null;
          });
        allRequests.push(request);
      }

      // Unwrap all the responses at the same time
      void Promise.all(allRequests)
        .then((responses) => {
          const allTopAds: InsightsQuery['insights']['edges'][] = [];
          if (responses.length) {
            for (const res of responses) {
              if (res?.success && res.data.insights.edges.length) allTopAds.push(res.data.insights.edges);
            }
            setInsightsTopAds(allTopAds);
          }
        })
        .catch((err: unknown) => {
          logger.error(err);
        })
        .finally(() => {
          setIsPending(false);
        });
    }
  }, [
    prevChartMetricValue,
    resetInsightsTopAds,
    searchParams,
    setInsightsTopAds,
    tGeneric,
    userDetails.currentOrganization,
  ]);

  const getCorrectOrder = (orderBy: InsightsColumnsOrderBy): OrderBy => {
    if (
      orderBy === InsightsColumnsOrderBy.cpm_abs ||
      orderBy === InsightsColumnsOrderBy.cpm_rel ||
      orderBy === InsightsColumnsOrderBy.cpc_abs ||
      orderBy === InsightsColumnsOrderBy.cpc_rel
    )
      return OrderBy.asc;
    return OrderBy.desc;
  };

  const handleOrderByChange = (value: string | null, option: ComboboxItem): void => {
    resetInsightsTopAds();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.orderBy, option.value);
    startTransition(() => {
      router.replace(newURL, { scroll: false });
    });
  };

  return (
    <Flex direction="column">
      <Title mb="md">{t('topAds')}</Title>
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
            { value: InsightsColumnsOrderBy.cpc_rel, label: `CPC (${tInsights('relative')})` },
            { value: InsightsColumnsOrderBy.spend_abs, label: tInsights('spent') },
            { value: InsightsColumnsOrderBy.impressions_abs, label: tInsights('impressions') },
            { value: InsightsColumnsOrderBy.clicks_abs, label: tInsights('clicks') },
            { value: InsightsColumnsOrderBy.cpm_abs, label: 'CPM' },
            { value: InsightsColumnsOrderBy.cpc_abs, label: 'CPC' },
          ]}
          value={getOrderByValue(searchParams)}
          onChange={handleOrderByChange}
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
          maw={280}
          disabled={isPending}
        />
      </Flex>

      <Flex direction="column" gap="xl">
        {insightsTopAds.length && !isPending
          ? insightsTopAds.map((publisherInsights) =>
              publisherInsights.length ? (
                <Flex key={uniqid()} direction="column" gap="sm">
                  <Title order={3}>{publisherInsights[0].publisher}</Title>
                  <InsightsGrid insights={publisherInsights} isPending={isPending} hideCardHeadings />
                </Flex>
              ) : null,
            )
          : null}

        {/* Loading State */}
        {isPending ? <LoaderCentered /> : null}
      </Flex>

      {!isPending && !insightsTopAds.length ? (
        <Text c="dimmed" ta="center">
          {tInsights('noResultsFound')}
        </Text>
      ) : null}
    </Flex>
  );
}
