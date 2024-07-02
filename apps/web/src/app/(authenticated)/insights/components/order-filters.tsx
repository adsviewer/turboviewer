'use client';

import { Flex, Text, Select, type ComboboxItem, Switch } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  OrderDirection,
  addOrReplaceURLParams,
  isParamInSearchParams,
  orderByKey,
  orderDirectionKey,
  pageSizeKey,
} from '@/util/url-query-utils';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

export default function OrderFilters(): React.ReactNode {
  const t = useTranslations('insights');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const getOrderByValue = (): string => {
    if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.impressions_rel)) {
      return InsightsColumnsOrderBy.impressions_rel;
    } else if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.cpm_rel)) {
      return InsightsColumnsOrderBy.cpm_rel;
    }
    return InsightsColumnsOrderBy.spend_rel; // default
  };

  const handlePageSizeChange = (value: string | null, option: ComboboxItem): void => {
    const newURL = addOrReplaceURLParams(pathname, searchParams, pageSizeKey, option.value);
    router.replace(newURL);
  };

  const handleOrderByChange = (value: string | null, option: ComboboxItem): void => {
    const newURL = addOrReplaceURLParams(pathname, searchParams, orderByKey, option.value);
    router.replace(newURL);
  };

  const handleOrderDirectionChange = (value: string | null, option: ComboboxItem): void => {
    const newURL = addOrReplaceURLParams(pathname, searchParams, orderDirectionKey, option.value);
    router.replace(newURL);
  };

  return (
    <Flex w="100%" mb="lg" wrap="wrap" direction="column">
      {/* FIlters */}
      <Flex>
        {/* Page size filter */}
        <Flex align="center" mr="sm" my="md">
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
          />
        </Flex>

        {/* Order filter */}
        <Flex align="center">
          <Text size="md" mr="sm">
            {t('orderBy')}:
          </Text>
          <Select
            placeholder="Pick value"
            data={[
              { value: InsightsColumnsOrderBy.spend_rel, label: t('spent') },
              { value: InsightsColumnsOrderBy.impressions_rel, label: t('impressions') },
              { value: InsightsColumnsOrderBy.cpm_rel, label: 'CPM' },
            ]}
            value={getOrderByValue()}
            onChange={handleOrderByChange}
            allowDeselect={false}
            comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
            maw={150}
            mr="sm"
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
            maw={150}
          />
        </Flex>
      </Flex>

      {/* Misc. controls */}
      <Flex>
        {/* Toggle ad previews */}
        <Switch label={t('showAdPreviews')} />
      </Flex>
    </Flex>
  );
}
