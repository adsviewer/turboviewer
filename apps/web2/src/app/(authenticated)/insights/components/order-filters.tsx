'use client';

import { Flex, Text, Select, type ComboboxItem } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { addOrReplaceURLParams, isParamInSearchParams } from '@/util/url-query-utils';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';

const OrderDirection = {
  asc: 'asc',
  desc: 'desc',
};

interface OrderFiltersProps {
  resultsCount: number;
}

export default function OrderFilters(props: OrderFiltersProps): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderDirectionKey = 'order';
  const orderByKey = 'orderBy';
  const pageSizeKey = 'pageSize';

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
      {/* Page data info */}
      <Text size="md" mr="auto">
        Page 1 of 1 ({props.resultsCount} results in total)
      </Text>

      {/* Filters */}
      <Flex align="center" mr="sm" my="md">
        {/* Page size filter */}
        <Text size="md" mr="sm">
          Page size:
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
          Order by:
        </Text>
        <Select
          placeholder="Pick value"
          data={[
            { value: InsightsColumnsOrderBy.spend, label: 'Spent' },
            { value: InsightsColumnsOrderBy.impressions, label: 'Impressions' },
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
            { value: OrderDirection.asc, label: 'Ascending' },
            { value: OrderDirection.desc, label: 'Descending' },
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
