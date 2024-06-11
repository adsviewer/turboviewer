'use client';

import { Card, Text, Badge, Group, Box, Flex } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { sentenceCase } from 'change-case';
import { YAxis } from 'recharts';
import { type CurrencyEnum, type DeviceEnum, type InsightsDatapoints } from '@/graphql/generated/schema-server';
import { dateFormatOptions } from '@/util/format-utils';
import { getCurrencySymbol } from '@/util/currency-utils';
// import AdPopover from './ad-popover';

interface InsightCardProps {
  title: string | null | undefined;
  description: string | null | undefined;
  device: DeviceEnum | null | undefined;
  rank: 'good' | 'mid' | 'bad' | 'unknown';
  currency: CurrencyEnum;
  datapoints: InsightsDatapoints[];
}

interface RankType {
  label: 'GOOD' | 'CAUTION' | 'BAD' | '-';
  color: 'green' | 'yellow' | 'red' | 'gray';
}

interface Datapoint {
  date: string;
  impressions: number;
  spend: number;
  cpm: number;
}

export default function InsightsGrid(props: InsightCardProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations('insights');
  // const computedColorScheme = useComputedColorScheme();
  // const theme = useMantineTheme();
  const [rank, setRank] = useState<RankType>({
    label: '-',
    color: 'gray',
  });
  const [datapoints, setDatapoints] = useState<Datapoint[]>([]);

  // Set the correct color of the icons based on the current color scheme
  // let iconColor = theme.colors.dark[2];
  // if (computedColorScheme === 'dark') {
  //   iconColor = theme.colors.gray[5];
  // }

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

  const setupDatapoints = useCallback(() => {
    const formattedDatapoints: Datapoint[] = [];
    for (const datapoint of props.datapoints) {
      formattedDatapoints.push({
        date: format.dateTime(new Date(datapoint.date), dateFormatOptions),
        impressions: datapoint.impressions,
        spend: datapoint.spend,
        cpm: datapoint.cpm,
      });
    }
    setDatapoints(formattedDatapoints);
  }, [props.datapoints, format]);

  useEffect(() => {
    setupRank();
    setupDatapoints();
  }, [setupRank, setupDatapoints]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Box>
        <AreaChart
          mt="md"
          px="sm"
          h={300}
          data={datapoints}
          dataKey="date"
          series={[
            {
              // @ts-expect-error - yAxisId works as intended
              yAxisId: 'right',
              name: 'spend',
              color: 'teal.6',
              label: `${t('spent')} (${getCurrencySymbol(props.currency)})`,
            },
            // @ts-expect-error - yAxisId works as intended
            { yAxisId: 'right', name: 'impressions', color: 'blue.6', label: t('impressions') },
            // @ts-expect-error - yAxisId works as intended
            { yAxisId: 'left', name: 'cpm', color: 'orange', label: 'CPM' },
          ]}
          tooltipProps={{ wrapperStyle: { zIndex: 3 } }}
          yAxisProps={{ yAxisId: 'left' }}
          areaProps={(series) => series}
          splitColors={['green', 'white']}
          withLegend
          curveType="natural"
          strokeWidth={1.5}
          tooltipAnimationDuration={200}
        >
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            type="number"
            tick={{
              transform: 'translate(10, 0)',
              fontSize: 12,
              fill: 'currentColor',
            }}
            allowDecimals
            tickLine={{
              color: 'var(--chart-grid-color)',
              stroke: 'var(--chart-grid-color)',
            }}
          />
        </AreaChart>
      </Box>

      <Group justify="space-between" mt="md" mb="xs">
        <Flex gap="sm" align="center">
          {/* {props.iframe ? <AdPopover iconColor={iconColor} iframe={props.iframe} /> : null} */}
          <Text fw={500}>{props.title}</Text>
        </Flex>
        <Badge color={rank.color}>{rank.label}</Badge>
      </Group>

      <Text size="sm" c="dimmed">
        {sentenceCase(props.description ?? '')}
      </Text>
    </Card>
  );
}
