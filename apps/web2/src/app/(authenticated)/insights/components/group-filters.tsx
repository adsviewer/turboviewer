import { Checkbox, Flex, MultiSelect, ScrollArea, Text } from '@mantine/core';
import { type ChangeEvent, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { InsightsColumnsGroupBy } from '@/graphql/generated/schema-server';
import { addOrReplaceURLParams, groupedByKey, isParamInSearchParams } from '@/util/url-query-utils';

export default function GroupFilters(): ReactNode {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleCheckboxFilter = (e: ChangeEvent<HTMLInputElement>): void => {
    const isChecked = e.target.checked;

    if (isChecked) {
      // router.replace(createURLWithNewParam(pathname, searchParams, groupedByKey, e.target.defaultValue));
      const newURL = addOrReplaceURLParams(pathname, searchParams, groupedByKey, e.target.defaultValue);
      router.replace(newURL);
    } else {
      const newURL = addOrReplaceURLParams(pathname, searchParams, groupedByKey, e.target.defaultValue);
      router.replace(newURL);
    }
  };

  const isChecked = (groupByValue: InsightsColumnsGroupBy): boolean => {
    if (isParamInSearchParams(searchParams, groupedByKey, groupByValue)) {
      return true;
    }
    return false;
  };

  return (
    <ScrollArea offsetScrollbars>
      <Flex direction="column">
        <Text size="xl">Filters</Text>
        <Text size="sm" mt="xs">
          Accounts
        </Text>
        <MultiSelect
          placeholder="Select accounts..."
          data={['Some Dude 1', 'Some Dude 2', 'Some Dude 3', 'Some Dude 4']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Positions
        </Text>
        <MultiSelect
          placeholder="Select positions..."
          data={['Facebook Reels', 'Facebook Stories', 'Instagram Reels', 'Instagram Stories']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Devices
        </Text>
        <MultiSelect
          placeholder="Select devices..."
          data={['Mobile (Web)', 'Mobile (App)', 'Desktop', 'Unknown']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Publishers
        </Text>
        <MultiSelect
          placeholder="Select publishers..."
          data={['Facebook', 'Instagram', 'Messenger', 'Audience Network', 'LinkedIn', 'TikTok', 'Unknown']}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="lg">
          Group By
        </Text>
        <Checkbox
          label="Account"
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.adAccountId}
          checked={isChecked(InsightsColumnsGroupBy.adAccountId)}
        />
        <Checkbox
          label="Ad ID"
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.adId}
          checked={isChecked(InsightsColumnsGroupBy.adId)}
        />
        <Checkbox
          label="Device"
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.device}
          checked={isChecked(InsightsColumnsGroupBy.device)}
        />
        <Checkbox
          label="Date"
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.date}
          checked={isChecked(InsightsColumnsGroupBy.date)}
        />
        <Checkbox
          label="Publisher"
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.publisher}
          checked={isChecked(InsightsColumnsGroupBy.publisher)}
        />
        <Checkbox
          label="Position"
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.position}
          checked={isChecked(InsightsColumnsGroupBy.position)}
        />
      </Flex>
    </ScrollArea>
  );
}
