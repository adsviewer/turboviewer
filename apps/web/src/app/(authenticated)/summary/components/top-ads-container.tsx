'use client';

import { Title, Flex, Select, type ComboboxItem } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { isParamInSearchParams, urlKeys, addOrReplaceURLParams } from '@/util/url-query-utils';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  IntegrationType,
  OrderBy,
} from '@/graphql/generated/schema-server';
import InsightsGrid from '@/components/insights/insights-grid';
import { insightsTopAdsAtom } from '@/app/atoms/insights-atoms';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
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

  // Top ads parameters that will re-render only the top ads when url state changes
  const [orderByParamValue, setOrderByParamValue] = useState<string | null>(null);

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
    return InsightsColumnsOrderBy.impressions_abs;
  };

  const resetInsightsTopAds = useCallback((): void => {
    setInsightsTopAds([]);
    setIsPending(true);
  }, [setInsightsTopAds]);

  useEffect(() => {
    // Logic to allow re-render only for search params of this component
    const currOrderByValue = searchParams.get(urlKeys.orderBy);
    if (currOrderByValue && orderByParamValue === currOrderByValue) return;
    setOrderByParamValue(currOrderByValue);

    // Params
    const topAdsParams: InsightsParams = {
      orderBy: currOrderByValue ? (currOrderByValue as InsightsColumnsOrderBy) : InsightsColumnsOrderBy.impressions_abs,
      order: OrderBy.desc,
      pageSize: 3,
      groupedBy: [InsightsColumnsGroupBy.adId, InsightsColumnsGroupBy.publisher],
      integrations: [IntegrationType.META],
    };

    logger.info(userDetails.currentOrganization?.integrations);

    // Get top ads' insights
    resetInsightsTopAds();
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
        logger.info(res.data.insights);
        setInsightsTopAds(res.data.insights.edges);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [orderByParamValue, resetInsightsTopAds, searchParams, setInsightsTopAds, tGeneric]);

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
            { value: InsightsColumnsOrderBy.spend_abs, label: tInsights('spent') },
            { value: InsightsColumnsOrderBy.impressions_abs, label: tInsights('impressions') },
            { value: InsightsColumnsOrderBy.cpm_abs, label: 'CPM' },
          ]}
          value={getOrderByValue()}
          onChange={handleOrderByChange}
          allowDeselect={false}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
          maw={280}
          disabled={isPending}
        />
      </Flex>
      <InsightsGrid insights={insightsTopAds} isPending={isPending} />
    </Flex>
  );
}
