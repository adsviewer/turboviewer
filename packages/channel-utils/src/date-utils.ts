import { addInterval, getDayPriorTillTomorrow, getTomorrowStartOfDay } from '@repo/utils';
import { prisma, type Tier } from '@repo/database';
import { tierConstraints } from '@repo/mappings';

export const timeRanges = async (
  initial: boolean,
  adAccountId: string,
  maxTimePeriodDays = 90,
): Promise<{ since: Date; until: Date }[]> => {
  const organizations = await prisma.organization.findMany({
    select: { tier: true },
    where: { adAccounts: { some: { id: adAccountId } } },
  });
  const latestInsight = await prisma.insight.findFirst({
    where: { adAccountId },
    select: { date: true },
    orderBy: { date: 'desc' },
  });
  return timeRangesHelper(initial, organizations, latestInsight, maxTimePeriodDays);
};

export const timeRangesHelper = (
  initial: boolean,
  organizations: { tier: Tier }[],
  latestInsight: {
    date: Date;
  } | null,
  maxTimePeriodDays = 90,
): { since: Date; until: Date }[] => {
  const organizationWithHighestTier = organizations.sort(
    (a, b) => tierConstraints[b.tier].order - tierConstraints[a.tier].order,
  )[0].tier;

  const maxRecencyInDays = tierConstraints[organizationWithHighestTier].maxRecency;

  const getUpdatedSince = (days: number, since?: Date): Date => {
    const maxRecencyDate = addInterval(new Date(), 'day', -days);
    if (!since || initial) return maxRecencyDate;
    return new Date(Math.max(since.getTime(), maxRecencyDate.getTime()));
  };

  const updatedSince = getUpdatedSince(maxRecencyInDays, latestInsight?.date);
  const range = getDayPriorTillTomorrow(updatedSince);
  return splitTimeRange(range.since, range.until, maxTimePeriodDays);
};

export const splitTimeRange = (
  since: Date,
  until: Date = new Date(),
  maxTimePeriodDays = 90,
): { since: Date; until: Date }[] => {
  if (since.getTime() > new Date().getTime()) return [];

  const periods: { since: Date; until: Date }[] = [];

  const diff = until.getTime() - since.getTime();
  if (diff < 1000 * 60 * 60 * 24 * maxTimePeriodDays) return [{ since, until }];

  const newDateUntil = addInterval(since, 'day', maxTimePeriodDays - 1);
  periods.push({ since, until: newDateUntil });
  const newDateSince = getTomorrowStartOfDay(newDateUntil);
  periods.push(...splitTimeRange(newDateSince, until, maxTimePeriodDays));
  return periods;
};
