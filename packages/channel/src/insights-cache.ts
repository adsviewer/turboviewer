import { type FilterInsightsInputType } from '@repo/channel-utils';
import { redisDelPattern, redisGet, redisSet } from '@repo/redis';
import { stringifySorted } from '@repo/utils';

const insightsCacheDurationSec = 8 * 3600; // 8 hours
const insightsCachePrefix = 'insights:';
const getInsightsCacheKey = (organizationId: string, args: FilterInsightsInputType): string =>
  `${insightsCachePrefix}${organizationId}:${stringifySorted(args)}`;

export const setInsightsCache = async (
  organizationId: string,
  args: FilterInsightsInputType,
  insights: object,
): Promise<void> => redisSet(getInsightsCacheKey(organizationId, args), insights, insightsCacheDurationSec);

export const getInsightsCache = async <T extends object>(
  organizationId: string,
  args: FilterInsightsInputType,
): Promise<T | null> => redisGet<T>(getInsightsCacheKey(organizationId, args));

export const deleteInsightsCache = (organizationId?: string): void => {
  redisDelPattern(`${insightsCachePrefix}${organizationId ? `${organizationId}:` : ''}*`);
};
