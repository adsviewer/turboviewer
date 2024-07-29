'use client';

import { Card, Text, Badge, Group, Box, Flex, Title, Tooltip } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { sentenceCase } from 'change-case';
import { YAxis } from 'recharts';
import {
  type PublisherEnum,
  type CurrencyEnum,
  type DeviceEnum,
  type IFrame,
  type InsightsDatapoints,
} from '@/graphql/generated/schema-server';
import { dateFormatOptions, truncateString } from '@/util/format-utils';
import { getCurrencySymbol } from '@/util/currency-utils';
import { publisherToIconMap } from '@/util/publisher-utils';

interface InsightCardProps {
  heading: string | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
  device: DeviceEnum | null | undefined;
  currency: CurrencyEnum;
  publisher: PublisherEnum | null | undefined;
  datapoints?: InsightsDatapoints[];
  iframe?: IFrame | null;
}

interface RankType {
  label: 'GOOD' | 'CAUTION' | '-';
  color: 'green' | 'yellow' | 'gray';
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
  const [rank, setRank] = useState<RankType>({
    label: 'GOOD',
    color: 'green',
  });
  const [datapoints, setDatapoints] = useState<Datapoint[]>([]);

  const setupRank = useCallback(() => {
    // If the latest CPM is lower than the previous CPM, rank is set to CAUTION
    if (props.datapoints) {
      if (props.datapoints[props.datapoints.length - 1].cpm > props.datapoints[props.datapoints.length - 2].cpm) {
        setRank({
          label: 'CAUTION',
          color: 'yellow',
        });
      }
    }
  }, [props.datapoints]);

  const setupDatapoints = useCallback(() => {
    const formattedDatapoints: Datapoint[] = [];
    if (props.datapoints) {
      for (const datapoint of props.datapoints) {
        formattedDatapoints.push({
          date: format.dateTime(new Date(datapoint.date), dateFormatOptions),
          impressions: datapoint.impressions,
          spend: datapoint.spend / 100,
          cpm: datapoint.cpm,
        });
      }
      setDatapoints(formattedDatapoints);
    }
  }, [props.datapoints, format]);

  useEffect(() => {
    if (props.datapoints) {
      setupRank();
      setupDatapoints();
    }
  }, [props.datapoints, setupDatapoints, setupRank]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Flex gap="sm" align="center">
        <Title order={3} fw={500} title={String(props.title)}>
          {truncateString(String(props.heading), 22)}
        </Title>
      </Flex>

      {props.datapoints ? (
        // Chart Analytics
        <Box>
          <AreaChart
            mt="md"
            px="sm"
            h={300}
            data={datapoints}
            dataKey="date"
            series={[
              {
                yAxisId: 'right',
                name: 'spend',
                color: 'teal.6',
                label: `${t('spent')} (${getCurrencySymbol(props.currency)})`,
              },
              { yAxisId: 'right', name: 'impressions', color: 'blue.6', label: t('impressions') },
              { yAxisId: 'left', name: 'cpm', color: 'orange', label: 'CPM' },
            ]}
            valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
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
      ) : (
        // IFrame ad preview
        <Flex justify="center">
          <iframe
            scrolling="no"
            src={props.iframe?.src}
            width={props.iframe?.width}
            height={props.iframe?.height}
            title={props.iframe?.src}
            loading="lazy"
            style={{ border: 'none' }}
          />
        </Flex>
      )}

      <Group justify="space-between" mt="md" mb="xs">
        <Flex gap="sm" align="center">
          <Tooltip label={String(props.title)} disabled={String(props.title) === t('insight')}>
            <Text fw={500}>{truncateString(String(props.title), 22)}</Text>
          </Tooltip>
        </Flex>
        {props.datapoints ? <Badge color={rank.color}>{rank.label}</Badge> : null}
      </Group>

      <Flex justify="space-between">
        <Text size="sm" c="dimmed">
          {sentenceCase(props.description ?? '')}
        </Text>
        {props.publisher ? (
          <Tooltip label={String(props.publisher)}>
            <div style={{ opacity: 0.3 }}>
              {(() => {
                const PublisherIcon = publisherToIconMap.get(props.publisher);
                return PublisherIcon ? <PublisherIcon /> : null;
              })()}
            </div>
          </Tooltip>
        ) : null}
      </Flex>
    </Card>
  );
}
