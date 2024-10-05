'use client';

import { Title, Flex, Select, type ComboboxItem } from '@mantine/core';
import { useAtom } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { isParamInSearchParams, urlKeys, addOrReplaceURLParams } from '@/util/url-query-utils';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  OrderBy,
  PublisherEnum,
} from '@/graphql/generated/schema-server';
import InsightsGrid from '@/components/insights/insights-grid';
import { insightsTopAdsAtom } from '@/app/atoms/insights-atoms';
import getInsights, { type InsightsParams } from '../../insights/actions';

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

export default function TopAdsContainer(): React.ReactNode {
  const t = useTranslations('summary');
  const tGeneric = useTranslations('generic');
  const tInsights = useTranslations('insights');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [insightsTopAds, setInsightsTopAds] = useAtom(insightsTopAdsAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

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

  const resetInsightsTopAds = useCallback((): void => {
    setInsightsTopAds([]);
  }, [setInsightsTopAds]);

  useEffect(() => {
    const topAdsParams = { ...TOP_ADS_INITIAL_PARAMS };
    const orderByValue = searchParams.get(urlKeys.orderBy);
    topAdsParams.orderBy = orderByValue ? (orderByValue as InsightsColumnsOrderBy) : INITIAL_ORDER_BY_VALUE;
    resetInsightsTopAds();

    // Get top ads' insights
    setIsPending(true);
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
        setIsPending(false);
      });
  }, [resetInsightsTopAds, searchParams, setInsightsTopAds, tGeneric]);

  const handleOrderByChange = (value: string | null, option: ComboboxItem): void => {
    resetInsightsTopAds();
    const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.orderBy, option.value);
    startTransition(() => {
      router.replace(newURL);
    });
  };
  return (
    <>
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
          disabled={isPending}
        />
      </Flex>
      <InsightsGrid insights={insightsTopAds} isPending={isPending} />
    </>
  );
}
