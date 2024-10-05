import { addInterval, getDayPriorTillTomorrow, getLastXMonths } from '@repo/utils';
import { prisma, Tier } from '@repo/database';
import { tierConstraints } from '@repo/mappings';

interface LatestInsightResult {
  date: Date;
  adAccount?: {
    organizations: {
      tier: Tier;
    }[];
  } | null;
}

export const timeRanges = async (initial: boolean, adAccountId: string): Promise<{ since: Date; until: Date }[]> => {
  const latestInsight = await prisma.insight.findFirst({
    select: { date: true, adAccount: { select: { organizations: { select: { tier: true } } } } },
    where: { adAccountId },
    orderBy: { date: 'desc' },
  });

  return timeRangeHelper(initial, latestInsight ?? undefined);
};

export const splitTimeRange = (maxRecency: number, since: Date, until: Date): { since: Date; until: Date }[] => {
  if (since.getTime() > new Date().getTime()) return [];
  const periods: { since: Date; until: Date }[] = [];
  const diffDays = Math.floor((until.getTime() - since.getTime()) / (1000 * 3600 * 24));

  if (diffDays <= maxRecency) {
    periods.push({ since, until });
  } else {
    let currentSince = since;
    while (Math.floor((until.getTime() - currentSince.getTime()) / (1000 * 3600 * 24)) > 0) {
      const daysRemaining = Math.floor((until.getTime() - currentSince.getTime()) / (1000 * 3600 * 24));
      let currentUntil;
      if (daysRemaining >= maxRecency) {
        currentUntil = addInterval(currentSince, 'day', Math.min(daysRemaining, maxRecency));
      } else {
        currentUntil = new Date(until);
        currentUntil.setMinutes(until.getMinutes());
        currentUntil.setSeconds(until.getSeconds());
        currentUntil.setMilliseconds(until.getMilliseconds());
      }
      periods.push({ since: currentSince, until: currentUntil });
      currentSince = currentUntil;
    }
  }

  return periods;
};

export const timeRangeHelper = (
  initial: boolean,
  latestInsight?: LatestInsightResult,
): { since: Date; until: Date }[] => {
  const organizations = latestInsight ? (latestInsight.adAccount?.organizations ?? []) : [];

  const organizationWithHighestTier =
    organizations.length > 0
      ? organizations.sort((a, b) => tierConstraints[b.tier].order - tierConstraints[a.tier].order)[0].tier
      : undefined;

  const maxRecency = tierConstraints[organizationWithHighestTier ?? Tier.Launch].maxRecency;

  if (initial) {
    const range = getLastXMonths();

    const adjustedSince = addInterval(range.until, 'day', -maxRecency);
    return splitTimeRange(maxRecency, adjustedSince, range.until);
  }
  const furthestDate = addInterval(new Date(), 'day', -maxRecency);
  const insightDateWithinLimit = latestInsight && latestInsight.date > furthestDate ? latestInsight.date : furthestDate;
  const range = getDayPriorTillTomorrow(insightDateWithinLimit);
  return splitTimeRange(maxRecency, range.since, range.until);
};
