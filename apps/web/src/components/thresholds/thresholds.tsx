import { ActionIcon, Modal, Tooltip, Text, NumberInput, Flex, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAdjustmentsHorizontal, IconCancel } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { type TransitionStartFunction, type ReactNode, useState, useEffect } from 'react';
import { getOrderByValue } from '@/util/insights-utils';
import { InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';
import { urlKeys } from '@/util/url-query-utils';

interface PropsType {
  isPending: boolean;
  startTransition: TransitionStartFunction;
}

export default function Thresholds(props: PropsType): ReactNode {
  const t = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);

  useEffect(() => {
    const currMinValue = searchParams.get(urlKeys.minThreshold);
    const currMaxValue = searchParams.get(urlKeys.maxThreshold);
    setMinValue(currMinValue ? Number(currMinValue) : null);
    setMaxValue(currMaxValue ? Number(currMaxValue) : null);
  }, [searchParams]);

  const getOrderByString = (): string => {
    const orderByValue = getOrderByValue(searchParams) as InsightsColumnsOrderBy;
    switch (orderByValue) {
      case InsightsColumnsOrderBy.impressions_abs:
      case InsightsColumnsOrderBy.impressions_rel:
        return t('impressions');
      case InsightsColumnsOrderBy.spend_abs:
      case InsightsColumnsOrderBy.spend_rel:
        return t('spent');
      case InsightsColumnsOrderBy.clicks_abs:
      case InsightsColumnsOrderBy.clicks_rel:
        return 'CPC';
      case InsightsColumnsOrderBy.cpm_abs:
      case InsightsColumnsOrderBy.cpm_rel:
        return 'CPM';
      default:
        return t('impressions');
    }
  };

  const handleMinValueChange = (value: string | number): void => {
    if (value || value === 0) setMinValue(Number(value));
    else setMinValue(null);
  };

  const handleMaxValueChange = (value: string | number): void => {
    if (value || value === 0) setMaxValue(Number(value));
    else setMaxValue(null);
  };

  const handleApply = (): void => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (minValue) newParams.set(urlKeys.minThreshold, String(minValue));
    else newParams.delete(urlKeys.minThreshold);
    if (maxValue) newParams.set(urlKeys.maxThreshold, String(maxValue));
    else newParams.delete(urlKeys.maxThreshold);
    const finalURL = `${pathname}?${newParams.toString()}`;
    props.startTransition(() => {
      router.replace(finalURL, { scroll: false });
      close();
    });
  };

  const handleReset = (): void => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete(urlKeys.minThreshold);
    newParams.delete(urlKeys.maxThreshold);
    const finalURL = `${pathname}?${newParams.toString()}`;
    props.startTransition(() => {
      router.replace(finalURL, { scroll: false });
      close();
    });
  };

  const hasActiveThresholds = (): boolean => {
    if (searchParams.get(urlKeys.minThreshold) ?? searchParams.get(urlKeys.maxThreshold)) return true;
    return false;
  };

  const closeModal = (): void => {
    setMinValue(null);
    setMaxValue(null);
    close();
  };

  return (
    <>
      <Tooltip label={tGeneric('thresholds')}>
        {/* Icon Button */}
        <ActionIcon
          onClick={() => {
            open();
          }}
          disabled={props.isPending}
          variant={hasActiveThresholds() ? 'gradient' : 'default'}
          size={35}
        >
          <IconAdjustmentsHorizontal />
        </ActionIcon>
      </Tooltip>

      {/* Modal */}
      <Modal opened={opened} onClose={closeModal} title={tGeneric('thresholds')}>
        <Text size="sm">{t('thresholdsDescription')}</Text>
        <Text size="sm" c="dimmed">
          {t('adjustingFor')}: <b>{getOrderByString()}</b>
        </Text>
        <Flex direction="column" my={20} gap={10}>
          <NumberInput
            label={tGeneric('minimum')}
            placeholder={tGeneric('none')}
            thousandSeparator=","
            allowNegative={false}
            value={minValue ?? ''}
            onChange={handleMinValueChange}
            min={1}
          />
          <NumberInput
            label={tGeneric('maximum')}
            placeholder={tGeneric('none')}
            thousandSeparator=","
            allowNegative={false}
            value={maxValue ?? ''}
            onChange={handleMaxValueChange}
            min={1}
          />
        </Flex>
        <Flex justify="flex-end" gap="sm">
          <Button onClick={handleReset} leftSection={<IconCancel />} variant="outline">
            {tGeneric('reset')}
          </Button>
          <Button onClick={handleApply}>{tGeneric('apply')}</Button>
        </Flex>
      </Modal>
    </>
  );
}
