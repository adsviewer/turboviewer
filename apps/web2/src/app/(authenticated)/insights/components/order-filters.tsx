'use client';

import { Flex, Text, Select, type ComboboxItem } from '@mantine/core';
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
    if (isParamInSearchParams(searchParams, orderByKey, InsightsColumnsOrderBy.impressions)) {
      return InsightsColumnsOrderBy.impressions;
    }
    return InsightsColumnsOrderBy.spend;
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
    <Flex w="100%" mb="lg" align="center" wrap="wrap">
      {/* Filters */}
      <Flex align="center" mr="sm" my="md">
        {/* Page size filter */}
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

      <Flex align="center">
        {/* Order filter */}
        <Text size="md" mr="sm">
          {t('orderBy')}:
        </Text>
        <Select
          placeholder="Pick value"
          data={[
            { value: InsightsColumnsOrderBy.spend, label: t('spent') },
            { value: InsightsColumnsOrderBy.impressions, label: t('impressions') },
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
  );
}
