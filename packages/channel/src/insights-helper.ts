import {
  CurrencyEnum,
  type DeviceEnum,
  type Insight,
  type IntegrationTypeEnum,
  prisma,
  type PublisherEnum,
} from '@repo/database';
import { FireAndForget, groupBy as groupByUtil, isAError, Language } from '@repo/utils';
import * as changeCase from 'change-case';
import {
  currencyToEuro,
  type FilterInsightsInputType,
  type GroupedInsightsWithEdges,
  type InsightsColumnsGroupByType,
} from '@repo/channel-utils';
import { getInsightsCache, setInsightsCache } from './insights-cache';
import { groupedInsights } from './insights-query-builder';

const fireAndForget = new FireAndForget();

const getUsdSpent = async (currency: CurrencyEnum, spend: bigint): Promise<bigint | null> => {
  if (currency === CurrencyEnum.USD) {
    return spend;
  }
  const [currInEur, eurUsd] = await Promise.all([
    currencyToEuro.getValue(currency, currency),
    currencyToEuro.getValue(CurrencyEnum.USD, CurrencyEnum.USD),
  ]);
  if (isAError(currInEur) || isAError(eurUsd)) return null;
  return BigInt(Math.round((Number(spend) / currInEur) * eurUsd));
};

export const getInsightsHelper = async (
  filter: FilterInsightsInputType,
  organizationId: string,
  acceptedLocale: string = Language.EN,
): Promise<GroupedInsightsWithEdges> => {
  const redisValue = await getInsightsCache<GroupedInsightsWithEdges>(organizationId, filter);
  if (redisValue) return redisValue;

  const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(filter.groupBy ?? []), 'currency'];

  const insightsRaw: Record<string, never>[] = await prisma.$queryRawUnsafe(
    groupedInsights(filter, organizationId, acceptedLocale, groupBy),
  );

  const insightsTransformed = insightsRaw.map((obj) => {
    const newObj: Record<string, never> = {};
    for (const key in obj) {
      if (key === 'interval_start') {
        newObj.date = obj[key];
      } else {
        newObj[changeCase.camelCase(key)] = obj[key];
      }
    }
    return newObj;
  }) as unknown as (Insight & {
    cpm: number;
    cpc: number | null;
    campaignId: string;
    adSetId: string;
    integration: IntegrationTypeEnum;
  })[];

  const ret: {
    id: string;
    adAccountId?: string;
    adId?: string;
    position?: string;
    device?: DeviceEnum;
    publisher?: PublisherEnum;
    currency: CurrencyEnum;
    datapoints: {
      spend: bigint;
      spendUsd: bigint | null;
      impressions: bigint;
      date: Date;
      cpm: bigint;
      clicks: bigint | null;
      cpc: bigint | null;
    }[];
    integration: IntegrationTypeEnum;
  }[] = [];
  const insightsGrouped = groupByUtil(insightsTransformed, (insight) => {
    return groupBy.map((group) => insight[group]).join('-');
  });
  for (const [_, value] of insightsGrouped) {
    if (value.length > 0) {
      const valueWithoutDatapoints = { ...value[0], date: undefined, impressions: undefined, spend: undefined };
      ret.push({
        ...valueWithoutDatapoints,
        id: groupBy.map((group) => value[0][group]).join('-'),
        datapoints: await Promise.all(
          value.map(async (v) => {
            const usdSpent = await getUsdSpent(v.currency, v.spend);
            return {
              spend: BigInt(v.spend),
              spendUsd: usdSpent ? BigInt(usdSpent) : null,
              impressions: BigInt(v.impressions),
              date: v.date,
              cpm: BigInt(Math.round(v.cpm)),
              clicks: v.clicks ? BigInt(v.clicks) : null,
              cpc: v.cpc ? BigInt(Math.round(v.cpc)) : null,
            };
          }),
        ),
      });
    }
  }

  const hasNext = ret.length > filter.pageSize;
  if (hasNext) ret.pop();

  const retVal = {
    hasNext,
    page: filter.page,
    pageSize: filter.pageSize,
    edges: ret,
  };
  fireAndForget.add(() => setInsightsCache(organizationId, filter, retVal));
  return retVal;
};
