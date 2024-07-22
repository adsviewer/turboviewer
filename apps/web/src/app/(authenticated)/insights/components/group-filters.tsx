import { Checkbox, Flex, MultiSelect, ScrollArea, Text } from '@mantine/core';
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { sentenceCase } from 'change-case';
import { useSetAtom } from 'jotai/index';
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
import { insightsAtom } from '@/app/atoms/insights-atoms';
import getAccounts from '../../actions';

interface MultiSelectDataType {
  value: string;
  label: string;
}

export default function GroupFilters(): ReactNode {
  const t = useTranslations('insights.filters');
  const setInsights = useSetAtom(insightsAtom);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

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

  const resetInsights = (): void => {
    setInsights([]);
  };

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
      data = [...data, { value: enumValue, label: sentenceCase(enumValue) }];
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
    resetInsights();
    startTransition(() => {
      router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
    });
  };

  const handleMultiFilterRemove = (key: string, value: string): void => {
    resetInsights();
    startTransition(() => {
      router.replace(addOrReplaceURLParams(pathname, searchParams, key, value));
    });
  };

  // Checkboxes logic //
  const handleCheckboxFilter = (e: ChangeEvent<HTMLInputElement>): void => {
    resetInsights();
    startTransition(() => {
      const isChecked = e.target.checked;

      if (isChecked) {
        const newURL = addOrReplaceURLParams(pathname, searchParams, groupedByKey, e.target.defaultValue);
        router.replace(newURL);
      } else {
        const newURL = addOrReplaceURLParams(pathname, searchParams, groupedByKey, e.target.defaultValue);
        router.replace(newURL);
      }
    });
  };

  const isChecked = (groupByValue: InsightsColumnsGroupBy): boolean =>
    isParamInSearchParams(searchParams, groupedByKey, groupByValue);

  return (
    <ScrollArea offsetScrollbars>
      <Flex direction="column">
        <Text size="xl">{t('title')}</Text>
        {accounts.length ? (
          <>
            <Text size="sm">{t('accounts')}</Text>

            <MultiSelect
              disabled={isPending}
              placeholder={`${t('selectAccounts')}...`}
              data={populateAccountsAvailableValues()}
              value={getAccountCurrentValues()}
              onOptionSubmit={(value) => {
                handleMultiFilterAdd(accountKey, value);
              }}
              onRemove={(value) => {
                handleMultiFilterRemove(accountKey, value);
              }}
              comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
              my={4}
              styles={{ pill: { width: 200 } }}
            />
          </>
        ) : null}
        <Text size="sm" mt="xs">
          {t('positions')}
        </Text>
        <MultiSelect
          disabled={isPending}
          placeholder={`${t('selectPositions')}...`}
          data={populatePositionAvailableValues()}
          value={getPositionCurrentValues()}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(positionKey, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(positionKey, value);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          {t('devices')}
        </Text>
        <MultiSelect
          disabled={isPending}
          placeholder={`${t('selectDevices')}...`}
          data={populateDeviceAvailableValues()}
          value={getDeviceCurrentValues()}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(deviceKey, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(deviceKey, value);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="xs">
          {t('publishers')}
        </Text>
        <MultiSelect
          disabled={isPending}
          placeholder={`${t('selectPublishers')}...`}
          data={populatePublisherAvailableValues()}
          value={getPublisherCurrentValues()}
          onOptionSubmit={(value) => {
            handleMultiFilterAdd(publisherKey, value);
          }}
          onRemove={(value) => {
            handleMultiFilterRemove(publisherKey, value);
          }}
          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
          my={4}
        />
        <Text size="sm" mt="lg">
          {t('groupBy')}
        </Text>
        <Checkbox
          disabled={isPending}
          label={t('account')}
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.adAccountId}
          checked={isChecked(InsightsColumnsGroupBy.adAccountId)}
        />
        <Checkbox
          disabled={isPending}
          label={t('adId')}
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.adId}
          checked={isChecked(InsightsColumnsGroupBy.adId)}
        />
        <Checkbox
          disabled={isPending}
          label={t('device')}
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.device}
          checked={isChecked(InsightsColumnsGroupBy.device)}
        />
        <Checkbox
          disabled={isPending}
          label={t('publisher')}
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.publisher}
          checked={isChecked(InsightsColumnsGroupBy.publisher)}
        />
        <Checkbox
          disabled={isPending}
          label={t('position')}
          my={4}
          onChange={handleCheckboxFilter}
          value={InsightsColumnsGroupBy.position}
          checked={isChecked(InsightsColumnsGroupBy.position)}
        />
      </Flex>
    </ScrollArea>
  );
}
