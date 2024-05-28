'use client';

import { Card, Image, Text, Badge, Group, Divider, Flex, useComputedColorScheme, useMantineTheme } from '@mantine/core';
import { IconCalendar, IconCoins, IconEye } from '@tabler/icons-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { type DateTimeFormatOptions, useFormatter } from 'next-intl';
import { CurrencyEnum, type DeviceEnum, type IFrame, type InsightsDatapoints } from '@/graphql/generated/schema-server';
import { snakeCaseToTitleCaseWithSpaces } from '@/util/string-utils';
import AdPopover from './ad-popover';

interface InsightCardProps {
  title: string | null | undefined;
  description: string | null | undefined;
  device: DeviceEnum | null | undefined;
  rank: 'good' | 'mid' | 'bad' | 'unknown';
  currency: CurrencyEnum | null | undefined;
  datapoints: InsightsDatapoints[];
  iframe: IFrame | null | undefined;
}

interface RankType {
  label: 'GOOD' | 'CAUTION' | 'BAD' | '-';
  color: 'green' | 'yellow' | 'red' | 'gray';
}

export default function InsightsGrid(props: InsightCardProps): ReactNode {
  const format = useFormatter();
  const dateFormatOptions: DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
  };
  const computedColorScheme = useComputedColorScheme();
  const theme = useMantineTheme();
  const [rank, setRank] = useState<RankType>({
    label: '-',
    color: 'gray',
  });

  // Set the correct color of the logo based on the current color scheme
  let iconColor = theme.colors.dark[2];
  if (computedColorScheme === 'dark') {
    iconColor = theme.colors.gray[5];
  }

  const setupRank = useCallback(() => {
    switch (props.rank) {
      case 'good':
        setRank({
          label: 'GOOD',
          color: 'green',
        });
        break;
      case 'mid':
        setRank({
          label: 'CAUTION',
          color: 'yellow',
        });
        break;
      case 'bad':
        setRank({
          label: 'BAD',
          color: 'red',
        });
        break;
      case 'unknown':
        setRank({
          label: '-',
          color: 'gray',
        });
        break;
      default:
        break;
    }
  }, [props.rank]);

  useEffect(() => {
    setupRank();
  }, [setupRank]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-5.png" height={300} />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{props.title}</Text>
        <Badge color={rank.color}>{rank.label}</Badge>
      </Group>

      <Text size="sm" c="dimmed">
        {snakeCaseToTitleCaseWithSpaces(props.description ?? '')}
      </Text>

      <Divider my="lg" />

      <Flex>
        <Flex align="center" mr="md">
          <IconCoins color={iconColor} />
          <Text size="sm" c="dimmed" ml={4}>
            {format.number(props.datapoints[0].spend / 100, {
              style: 'currency',
              currency: props.currency ?? CurrencyEnum.EUR,
            })}
          </Text>
        </Flex>
        <Flex align="center" mr="md">
          <IconEye color={iconColor} />
          <Text size="sm" c="dimmed" ml={4}>
            {format.number(props.datapoints[0].impressions, { style: 'decimal' })}
          </Text>
        </Flex>

        <Flex align="center" mr="md">
          <IconCalendar color={iconColor} />
          <Text size="sm" c="dimmed" ml={4}>
            {format.dateTime(new Date(props.datapoints[0].date), dateFormatOptions)}
          </Text>
        </Flex>

        {props.iframe ? (
          <Flex align="center" justify="flex-end" w="100%" mr="md">
            <AdPopover iconColor={iconColor} iframe={props.iframe} />
          </Flex>
        ) : null}
      </Flex>
    </Card>
  );
}
