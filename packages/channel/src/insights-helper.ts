import { type CurrencyEnum, type DeviceEnum, type Insight, prisma, type PublisherEnum } from '@repo/database';
import { AError, FireAndForget, groupBy as groupByUtil } from '@repo/utils';
import * as changeCase from 'change-case';
import { type FilterInsightsInputType, type InsightsColumnsGroupByType, type GroupedInsightsWithEdges } from '@repo/channel-utils';
import { getInsightsCache, setInsightsCache } from './insights-cache';
import { groupedInsights } from './insights-query-builder';

const fireAndForget = new FireAndForget();

export interface FieldNode {
  kind: string;
  name: {
    value: string;
  };
  selectionSet?: {
    selections: {
      kind: string;
      name: { value: string };
    }[];
  };
}

export const getInsightsHelper = async (
  filter?: FilterInsightsInputType, // TODO: should be required
  organizationId?: string, // TODO: should be required
  acceptedLocale?: string,
): Promise<GroupedInsightsWithEdges> => {
  // TODO :remove the condition and make the parameters required
  if( !filter || !organizationId || !acceptedLocale ) throw new AError("Required parameters not passed")

  const redisValue = await getInsightsCache<GroupedInsightsWithEdges>(organizationId, filter);
  if (redisValue) return redisValue;

  const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(filter.groupBy ?? []), 'currency'];

  const insightsRaw: Record<string, never>[] = await prisma.$queryRawUnsafe(
    groupedInsights(filter, organizationId, acceptedLocale),
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
  }) as unknown as (Insight & { cpm: number; campaignId: string; adSetId: string })[];

  const ret: {
    id: string;
    adAccountId?: string;
    adId?: string;
    position?: string;
    device?: DeviceEnum;
    publisher?: PublisherEnum;
    currency: CurrencyEnum;
    datapoints: { spend: bigint; impressions: bigint; date: Date; cpm: bigint }[];
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
        datapoints: value.map((v) => ({
          spend: BigInt(v.spend),
          impressions: BigInt(v.impressions),
          date: v.date,
          cpm: BigInt(Math.round(v.cpm)),
        })),
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