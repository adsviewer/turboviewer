'use client';

import { Badge, Box, Card, Flex, Group, Text, Title, Tooltip } from '@mantine/core';
import { AreaChart, type AreaChartSeries } from '@mantine/charts';
import * as React from 'react';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { sentenceCase } from 'change-case';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { useSearchParams } from 'next/navigation';
import { IconChartLine, IconClick, IconCoins, IconEye, IconZoomMoney } from '@tabler/icons-react';
// import Embed from '@repo/ui/embed';
import IFrameComponent from '@repo/ui/iframe';
import EmbedComponent from '@repo/ui/embed';
import {
  type CurrencyEnum,
  type DeviceEnum,
  type IFrame,
  IFrameType,
  type InsightsDatapoints,
  type PublisherEnum,
} from '@/graphql/generated/schema-server';
import { dateFormatOptions, truncateString } from '@/util/format-utils';
import { getCurrencySymbol } from '@/util/currency-utils';
import { deviceToIconMap, publisherToIconMap } from '@/util/insights-utils';
import { urlKeys, ChartMetricsEnum } from '@/util/url-query-utils';
import LoaderCentered from '@/components/misc/loader-centered';
import { type Datapoint } from '@/util/charts-utils';

interface InsightCardProps {
  heading: string | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
  device: DeviceEnum | null | undefined;
  currency: CurrencyEnum;
  publisher: PublisherEnum | null | undefined;
  datapoints?: InsightsDatapoints[];
  iframe?: IFrame | null;
  hideHeading?: boolean;
}

interface RankType {
  label: 'GOOD' | 'CAUTION' | '-';
  color: 'green' | 'yellow' | 'gray';
}

export default function InsightCard(props: InsightCardProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const searchParams = useSearchParams();
  const [isLoadingIframe, setIsLoadingIframe] = useState<boolean>(true);
  const [rank, setRank] = useState<RankType>({
    label: 'GOOD',
    color: 'green',
  });
  const [datapoints, setDatapoints] = useState<Datapoint[]>([]);

  const copyText = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      notifications.show({
        title: tGeneric('success'),
        message: sentenceCase(tGeneric('copied')),
        color: 'blue',
      });
    } catch (error) {
      logger.error(error);
    }
  };

  const setupRank = useCallback(() => {
    // If the latest CPM is lower than the previous CPM, rank is set to CAUTION
    if (props.datapoints) {
      if (props.datapoints.length > 1) {
        const cpmLatest = props.datapoints[props.datapoints.length - 1].cpm ?? 0;
        const cpmPrev = props.datapoints[props.datapoints.length - 2].cpm ?? 0;
        if (cpmLatest > cpmPrev) {
          setRank({
            label: 'CAUTION',
            color: 'yellow',
          });
        }
      } else {
        setRank({
          label: 'GOOD',
          color: 'green',
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
          spend: Math.floor(Number(datapoint.spend) / 100),
          cpm: datapoint.cpm ? Number(datapoint.cpm.toFixed(3)) : 0,
          cpc: datapoint.cpc ?? 0,
          clicks: datapoint.clicks ?? 0,
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

  const getIFrameHtml = (): ReactNode => {
    if (!props.iframe) return <Flex justify="center" />;

    switch (props.iframe.type) {
      case IFrameType.EMBEDDED:
        return <EmbedComponent data={props.iframe} setIsLoadingIframe={setIsLoadingIframe} />;
      case IFrameType.IFRAME:
        return <IFrameComponent data={props.iframe} setIsLoadingIframe={setIsLoadingIframe} />;
      default:
        logger.error('Unknown iframe type');
        return <Flex justify="center" />;
    }
  };

  const getChartSeries = (): AreaChartSeries[] => {
    if (searchParams.get(urlKeys.chartMetric) === ChartMetricsEnum.SpentCPM) {
      return [
        {
          yAxisId: 'left',
          name: 'spend',
          color: 'teal.6',
          label: `${t('spent')} (${getCurrencySymbol(props.currency)})`,
        },
        { yAxisId: 'right', name: 'cpm', color: 'orange', label: 'CPM' },
      ];
    }

    return [
      { yAxisId: 'left', name: 'impressions', color: 'blue.6', label: t('impressions') },
      { yAxisId: 'right', name: 'cpm', color: 'orange', label: 'CPM' },
    ];
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      {!props.hideHeading ? (
        <Flex gap="sm" align="center">
          <Title order={3} mb="md" fw={500} title={String(props.title)}>
            {props.heading}
          </Title>
        </Flex>
      ) : null}

      {!searchParams.has(urlKeys.fetchPreviews) ? (
        // Chart Analytics
        <Box>
          <AreaChart
            h={300}
            tooltipProps={{ wrapperStyle: { zIndex: 10 } }}
            curveType="natural"
            strokeWidth={1.5}
            tooltipAnimationDuration={200}
            withLegend
            withRightYAxis
            valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
            dataKey="date"
            data={datapoints}
            series={getChartSeries()}
          />
        </Box>
      ) : (
        // IFrame ad preview
        <Flex justify="center" align="center" mb="auto" h="100%">
          {isLoadingIframe ? (
            <Box pos="absolute">
              <LoaderCentered type="bars" />
            </Box>
          ) : null}
          {getIFrameHtml()}
        </Flex>
      )}

      {/* Title */}
      <Group justify="space-between" mt="md" mb="xs">
        <Flex gap="sm" align="center">
          {String(props.title) !== t('insight') ? (
            <Tooltip label={String(props.title)}>
              <Text
                style={{ cursor: 'pointer' }}
                fw={500}
                onClick={() => {
                  void copyText(String(props.title));
                }}
              >
                {truncateString(String(props.title), 22)}
              </Text>
            </Tooltip>
          ) : (
            <Text fw={500}>{truncateString(String(props.title), 22)}</Text>
          )}
        </Flex>
        {props.datapoints ? <Badge color={rank.color}>{rank.label}</Badge> : null}
      </Group>

      {/* Descriptions */}
      <Flex justify="space-between">
        <Text
          size="sm"
          c="dimmed"
          onClick={() => {
            if (props.description) {
              void copyText(sentenceCase(props.description));
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          {sentenceCase(props.description ?? '')}
        </Text>
        <Flex>
          {props.device ? (
            <Tooltip label={String(props.device)}>
              <div style={{ opacity: 0.3 }}>
                {(() => {
                  const DeviceIcon = deviceToIconMap.get(props.device);
                  return DeviceIcon ? <DeviceIcon /> : null;
                })()}
              </div>
            </Tooltip>
          ) : null}
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
      </Flex>

      {/* Stats */}
      {datapoints.length ? (
        <Flex gap="md" wrap="wrap">
          {/* Impressions */}
          <Tooltip label={t('impressions')}>
            <Flex
              align="center"
              gap={3}
              onClick={() => {
                void copyText(String(datapoints[datapoints.length - 1].impressions));
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconEye />
              <Text size="sm" c="dimmed">
                {format.number(datapoints[datapoints.length - 1].impressions, { style: 'decimal' })}
              </Text>
            </Flex>
          </Tooltip>
          {/* Spend */}
          <Tooltip label={t('spent')}>
            <Flex
              align="center"
              gap="xs"
              onClick={() => {
                void copyText(String(Number(datapoints[datapoints.length - 1].spend) / 100));
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconCoins />
              <Text size="sm" c="dimmed">
                {format.number(Number(datapoints[datapoints.length - 1].spend) / 100, {
                  style: 'currency',
                  currency: props.currency,
                })}
              </Text>
            </Flex>
          </Tooltip>
          {/* CPM */}
          <Tooltip label="CPM">
            <Flex
              align="center"
              gap="xs"
              onClick={() => {
                void copyText(String(datapoints[datapoints.length - 1].cpm));
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconChartLine />
              <Text size="sm" c="dimmed">
                {datapoints[datapoints.length - 1].cpm}
              </Text>
            </Flex>
          </Tooltip>
          {/* CPC */}
          <Tooltip label="CPC">
            <Flex
              align="center"
              gap="xs"
              onClick={() => {
                void copyText(String(datapoints[datapoints.length - 1].cpc));
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconZoomMoney />
              <Text size="sm" c="dimmed">
                {datapoints[datapoints.length - 1].cpc}
              </Text>
            </Flex>
          </Tooltip>
          {/* Clicks */}
          <Tooltip label="Clicks">
            <Flex
              align="center"
              gap="xs"
              onClick={() => {
                void copyText(String(datapoints[datapoints.length - 1].clicks));
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconClick />
              <Text size="sm" c="dimmed">
                {datapoints[datapoints.length - 1].clicks}
              </Text>
            </Flex>
          </Tooltip>
        </Flex>
      ) : null}
    </Card>
  );
}
