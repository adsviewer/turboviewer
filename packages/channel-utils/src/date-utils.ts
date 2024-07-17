import { getDayPriorTillTomorrow, getLastXMonths } from '@repo/utils';
import { prisma } from '@repo/database';

export const timeRange = async (initial: boolean, adAccountId: string): Promise<{ until: Date; since: Date }> => {
  if (initial) return getLastXMonths();
  const latestInsight = await prisma.insight.findFirst({
    select: { date: true },
    where: { adAccountId },
    orderBy: { date: 'desc' },
  });
  return latestInsight ? getDayPriorTillTomorrow(latestInsight.date) : getLastXMonths();
};
