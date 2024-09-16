import { addInterval, getDayPriorTillTomorrow, getLastXMonths, getTomorrowStartOfDay } from '@repo/utils';
import { prisma } from '@repo/database';
import { tierConstraints } from '@repo/mappings';

export const timeRanges = async (initial: boolean, adAccountId: string): Promise<{ since: Date; until: Date }[]> => {
  if (initial) {
    const range = getLastXMonths();
    return splitTimeRange(range.since, range.until);
  }
  const latestInsight = await prisma.insight.findFirst({
    select: { date: true, adAccount: { select: { organizations: { select: { tier: true } } } } },
    where: { adAccountId },
    orderBy: { date: 'desc' },
  });

  const organizationTier = latestInsight?.adAccount?.organizations[0]?.tier;

  const furthestDate = addInterval(new Date(), 'day', -tierConstraints[organizationTier || 'Launch'].maxRecency);
  const range = latestInsight ? getDayPriorTillTomorrow(latestInsight.date) : getDayPriorTillTomorrow(furthestDate);
  return splitTimeRange(range.since, range.until, tierConstraints[organizationTier || 'Launch'].maxRecency);
};

export const splitTimeRange = (since: Date, until: Date = new Date(), maxTimePeriodDays?: number): { since: Date; until: Date }[] => {
  const maxTimePeriod = 1000 * 60 * 60 * 24 * (maxTimePeriodDays || 7); // min recency in days
  if (since.getTime() > new Date().getTime()) return [];

  const periods: { since: Date; until: Date }[] = [];

  const diff = until.getTime() - since.getTime();
  if (diff < maxTimePeriod) return [{ since, until }];

  const newDateUntil = addInterval(since, 'day', (maxTimePeriodDays || 7) - 1);
  periods.push({ since, until: newDateUntil });
  const newDateSince = getTomorrowStartOfDay(newDateUntil);
  periods.push(...splitTimeRange(newDateSince, until));
  return periods;
};
