'use client';

import { Title, Flex, Text, Select, type ComboboxItem } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useCallback, useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import uniqid from 'uniqid';
import { urlKeys, addOrReplaceURLParams } from '@/util/url-query-utils';
import {
  InsightsColumnsGroupBy,
  InsightsColumnsOrderBy,
  InsightsInterval,
  type InsightsQuery,
  OrderBy,
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

  // Top ads parameters that will re-render only the top ads when url state changes
  const [orderByParamValue, setOrderByParamValue] = useState<string | null>(null);

  const resetInsightsTopAds = useCallback((): void => {
    setInsightsTopAds([]);
    setIsPending(true);
  }, [setInsightsTopAds]);

  useEffect(() => {
    // Logic to allow re-render only for search params of this component
    const currOrderByValue = searchParams.get(urlKeys.orderBy);
    if (currOrderByValue && orderByParamValue === currOrderByValue) return;
    setOrderByParamValue(currOrderByValue);

    // Get top ads' insights
    // Perform a request for each integration that the user has
    resetInsightsTopAds();
    if (userDetails.currentOrganization) {
      const allRequests: Promise<UrqlResult<InsightsQuery> | null>[] = [];
      for (const integration of userDetails.currentOrganization.integrations) {
        const TOP_ADS_PARAMS: InsightsParams = {
          orderBy: currOrderByValue
            ? (currOrderByValue as InsightsColumnsOrderBy)
            : InsightsColumnsOrderBy.impressions_abs,
          order: OrderBy.desc,
          pageSize: 3,
          interval: InsightsInterval.week,
          groupedBy: [
            InsightsColumnsGroupBy.adId,
            InsightsColumnsGroupBy.publisher,
            InsightsColumnsGroupBy.integration,
          ],
          integrations: [integration.type],
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
          })
          .finally(() => {
            setIsPending(false);
          });
        allRequests.push(request);
      }

      // Unwrap all the responses at the same time
      void Promise.all(allRequests)
        .then((responses) => {
          const allTopAds: InsightsQuery['insights']['edges'][] = [];
          if (responses.length) {
            for (const res of responses) {
              if (res?.success) allTopAds.push(res.data.insights.edges);
            }
            setInsightsTopAds(allTopAds);
          }
        })
        .catch((err: unknown) => {
          logger.error(err);
        });
    }
  }, [
    orderByParamValue,
    resetInsightsTopAds,
    searchParams,
    setInsightsTopAds,
    tGeneric,
    userDetails.currentOrganization,
  ]);

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
        {insightsTopAds.length && !isPending ? (
          insightsTopAds.map((integrationInsights) =>
            integrationInsights.length ? (
              <Flex key={uniqid()} direction="column" gap="sm">
                <Title order={3} c="dimmed">
                  {integrationInsights[0].integration}
                </Title>
                <InsightsGrid insights={integrationInsights} isPending={isPending} />
              </Flex>
            ) : null,
          )
        ) : (
          <LoaderCentered />
        )}
      </Flex>

      {!isPending && !insightsTopAds.length ? (
        <Text ta="center" c="dimmed">
          {tInsights('noResultsFound')}
        </Text>
      ) : null}
    </Flex>
  );
}
