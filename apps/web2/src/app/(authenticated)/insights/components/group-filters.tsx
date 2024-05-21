import { Checkbox, Flex, MultiSelect, ScrollArea, Text } from '@mantine/core';
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DeviceEnum, InsightsColumnsGroupBy, PublisherEnum } from '@/graphql/generated/schema-server';
import {
  addOrReplaceURLParams,
  deviceKey,
  groupedByKey,
  isParamInSearchParams,
  positionKey,
  positions,
  publisherKey,
  accountKey,
} from '@/util/url-query-utils';
import { titleCaseToSpaces } from '@/util/string-utils';
import getAccounts from '../../actions';

interface MultiSelectDataType {
  value: string;
  label: string;
}

export default function GroupFilters(): ReactNode {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Dropdowns logic //

  // Accounts
  // Get ad account for every integration!
  const [accounts, setAccounts] = useState<MultiSelectDataType[]>([]);
  useEffect(() => {
    void getAccounts().then((res) => {
      const integrations = res.integrations;
      let adAccounts: MultiSelectDataType[] = [];
      for (const integration of integrations) {
        for (const adAccount of integration.adAccounts) {
          const newValue: MultiSelectDataType = {
            value: adAccount.id,
            label: adAccount.name,
          };
          adAccounts = [...adAccounts, newValue];
        }
      }
      setAccounts(adAccounts);
    });
  }, []);

  const populateAccountsAvailableValues = (): MultiSelectDataType[] => {
    let data: MultiSelectDataType[] = [];
    for (const account of accounts) {
      data = [...data, { value: account.value, label: account.label }];
    }
    return data;
  };

  const getAccountCurrentValues = (): string[] => {
    let values: string[] = [];
    for (const account of accounts) {
      const value = account.value;
      if (isParamInSearchParams(searchParams, accountKey, value)) {
        values = [...values, value];
      }
    }
    return values;
  };

  // Positions (will be refactored to use the enum from schema-server when it is done)
  // (for now we create a map instead of an enum...)
  const populatePositionAvailableValues = (): MultiSelectDataType[] => {
    let data: MultiSelectDataType[] = [];
    for (const position of positions) {
      data = [...data, { value: position.value, label: position.label }];
    }
    return data;
  };

  const getPositionCurrentValues = (): string[] => {
    let values: string[] = [];
    for (const position of positions) {
      const value = position.value;
      if (isParamInSearchParams(searchParams, positionKey, value)) {
        values = [...values, value];
      }
    }
    return values;
  };

  // Publishers
  const populatePublisherAvailableValues = (): MultiSelectDataType[] => {
    let data: MultiSelectDataType[] = [];
    for (const key of Object.keys(PublisherEnum)) {
      const enumValue = PublisherEnum[key as keyof typeof PublisherEnum];
      data = [...data, { value: enumValue, label: enumValue }];
    }
    return data;
  };

  const getPublisherCurrentValues = (): string[] => {
    let values: string[] = [];
    for (const key of Object.keys(PublisherEnum)) {
      const enumValue = PublisherEnum[key as keyof typeof PublisherEnum];
      if (isParamInSearchParams(searchParams, publisherKey, enumValue)) {
        values = [...values, enumValue];
      }
    }
    return values;
  };

  // Devices
  const populateDeviceAvailableValues = (): MultiSelectDataType[] => {
    let data: MultiSelectDataType[] = [];
    for (const key of Object.keys(DeviceEnum)) {
      const enumValue = DeviceEnum[key as keyof typeof DeviceEnum];
      data = [...data, { value: enumValue, label: titleCaseToSpaces(enumValue) }];
    }
    return data;
  };

  const getDeviceCurrentValues = (): string[] => {
    let values: string[] = [];
    for (const key of Object.keys(DeviceEnum)) {
      const enumValue = DeviceEnum[key as keyof typeof DeviceEnum];
      if (isParamInSearchParams(searchParams, deviceKey, enumValue)) {
        values = [...values, enumValue];
      }
    }
    return values;
  };

  // Generic functions for handling changes in multi-dropdowns
  const handleMultiFilterAdd = (key: string, value: string): void => {
    router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
  };

  const handleMultiFilterRemove = (key: string, value: string): void => {
    router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
  };

  // Checkboxes logic //
  const handleCheckboxFilter = (e: ChangeEvent<HTMLInputElement>): void => {
    const isChecked = e.target.checked;

    if (isChecked) {
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
        {accounts.length ? (
          <>
            <Text size="sm" mt="xs">
              Accounts
            </Text>

            <MultiSelect
              placeholder="Select accounts..."
              data={populateAccountsAvailableValues()}
              value={getAccountCurrentValues()}
              onOptionSubmit={(value) => {
                handleMultiFilterAdd(accountKey, value);
              }}
              onRemove={(value) => {
                handleMultiFilterRemove(accountKey, value);
              }}
              comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
              my={4}
            />
          </>
        ) : null}
        <Text size="sm" mt="xs">
          Positions
        </Text>
        <MultiSelect
          placeholder="Select positions..."
          data={populatePositionAvailableValues()}
          value={getPositionCurrentValues()}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(positionKey, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(positionKey, value);
          }}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Devices
        </Text>
        <MultiSelect
          placeholder="Select devices..."
          data={populateDeviceAvailableValues()}
          value={getDeviceCurrentValues()}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(deviceKey, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(deviceKey, value);
          }}
          comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          Publishers
        </Text>
        <MultiSelect
          placeholder="Select publishers..."
          data={populatePublisherAvailableValues()}
          value={getPublisherCurrentValues()}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(publisherKey, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(publisherKey, value);
          }}
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
