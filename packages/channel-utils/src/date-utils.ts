import { addInterval, getDayPriorTillTomorrow, getLastXMonths, getTomorrowStartOfDay } from '@repo/utils';
import { type Insight, prisma, Tier } from '@repo/database';
import { tierConstraints } from '@repo/mappings';

interface LatestInsightResult {
  date: Date;
  adAccount?: {
    organizations: {
      tier: Tier;
    }[];
  };
}

export const timeRanges = async (initial: boolean, adAccountId: string): Promise<{ since: Date; until: Date }[]> => {
  const latestInsight = await prisma.insight.findFirst({
    select: { date: true, adAccount: { select: { organizations: { select: { tier: true } } } } },
    where: { adAccountId },
    orderBy: { date: 'desc' },
  });

  const organizations = latestInsight?.adAccount?.organizations ?? [];

  const organizationWithHighestTier =
    organizations.length > 0
      ? organizations.sort((a, b) => tierConstraints[b.tier].order - tierConstraints[a.tier].order)[0].tier
      : undefined;

  const maxRecency = tierConstraints[organizationWithHighestTier ?? Tier.Launch].maxRecency;

  if (initial) {
    const range = getLastXMonths();

    if (!organizationWithHighestTier) {
      return splitTimeRange(tierConstraints[Tier.Launch].maxRecency, range.since, range.until);
    }

    return splitTimeRange(maxRecency, range.since, range.until);
  }
  const furthestDate = addInterval(new Date(), 'day', -maxRecency);
  const insightDateWithinLimit = latestInsight && latestInsight.date > furthestDate ? latestInsight.date : furthestDate;
  const range = getDayPriorTillTomorrow(insightDateWithinLimit);
  return splitTimeRange(maxRecency, range.since, range.until);
};

export const splitTimeRange = (
  maxTimePeriodDays: number,
  since: Date,
  until: Date = new Date(),
): { since: Date; until: Date }[] => {
  const maxTimePeriod = 1000 * 60 * 60 * 24 * maxTimePeriodDays;
  if (since.getTime() > new Date().getTime()) return [];

  const periods: { since: Date; until: Date }[] = [];

  const diff = until.getTime() - since.getTime();
  if (diff < maxTimePeriod) return [{ since, until }];

  const newDateUntil = addInterval(since, 'day', maxTimePeriodDays - 1);
  periods.push({ since, until: newDateUntil });
  const newDateSince = getTomorrowStartOfDay(newDateUntil);
  periods.push(...splitTimeRange(maxTimePeriodDays, newDateSince, until));
  return periods;
};

export const testTimeRange = (
  initial: boolean,
  latestInsight?: Partial<Insight> & LatestInsightResult,
): { since: Date; until: Date }[] => {
  const organizations = latestInsight ? (latestInsight.adAccount?.organizations ?? []) : [];

  const organizationWithHighestTier =
    organizations.length > 0
      ? organizations.sort((a, b) => tierConstraints[b.tier].order - tierConstraints[a.tier].order)[0].tier
      : undefined;

  const maxRecency = tierConstraints[organizationWithHighestTier ?? Tier.Launch].maxRecency;

  if (initial) {
    const range = getLastXMonths();

    if (!organizationWithHighestTier) {
      return splitTimeRange(tierConstraints[Tier.Launch].maxRecency, range.since, range.until);
    }

    return splitTimeRange(maxRecency, range.since, range.until);
  }
  const furthestDate = addInterval(new Date(), 'day', -maxRecency);
  const insightDateWithinLimit = latestInsight && latestInsight.date > furthestDate ? latestInsight.date : furthestDate;
  const range = getDayPriorTillTomorrow(insightDateWithinLimit);
  return splitTimeRange(maxRecency, range.since, range.until);
};
