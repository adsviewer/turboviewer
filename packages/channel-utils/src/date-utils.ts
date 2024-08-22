import { addInterval, getDayPriorTillTomorrow, getLastXMonths, getTomorrowStartOfDay } from '@repo/utils';
import { prisma } from '@repo/database';

export const timeRanges = async (initial: boolean, adAccountId: string): Promise<{ since: Date; until: Date }[]> => {
  if (initial) {
    const range = getLastXMonths();
    return splitTimeRange(range.since, range.until);
  }
  const latestInsight = await prisma.insight.findFirst({
    select: { date: true },
    where: { adAccountId },
    orderBy: { date: 'desc' },
  });
  const furthestDate = addInterval(new Date(), 'day', -maxTimePeriodDays);
  const range = latestInsight ? getDayPriorTillTomorrow(latestInsight.date) : getDayPriorTillTomorrow(furthestDate);
  return splitTimeRange(range.since, range.until);
};

const maxTimePeriodDays = 90; // 90 days
const maxTimePeriod = 1000 * 60 * 60 * 24 * maxTimePeriodDays;
export const splitTimeRange = (since: Date, until: Date = new Date()): { since: Date; until: Date }[] => {
  if (since.getTime() > new Date().getTime()) return [];

  const periods: { since: Date; until: Date }[] = [];

  const diff = until.getTime() - since.getTime();
  if (diff < maxTimePeriod) return [{ since, until }];

  const newDateUntil = addInterval(since, 'day', maxTimePeriodDays - 1);
  periods.push({ since, until: newDateUntil });
  const newDateSince = getTomorrowStartOfDay(newDateUntil);
  periods.push(...splitTimeRange(newDateSince, until));
  return periods;
};
