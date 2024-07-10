import type { AdAccount, Integration } from '@repo/database';
import { prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { getBeforeXMonths, getYesterday } from '@repo/utils';
import type { ChannelAd, ChannelAdAccount, ChannelInsight } from './channel-interface';

export const saveAccounts = async (
  activeAccounts: ChannelAdAccount[],
  integration: Integration,
): Promise<AdAccount[]> =>
  await Promise.all(
    activeAccounts.map((acc) =>
      prisma.adAccount.upsert({
        where: {
          integrationId_externalId: {
            integrationId: integration.id,
            externalId: acc.externalId,
          },
        },
        update: { currency: acc.currency, name: acc.name },
        create: {
          integrationId: integration.id,
          externalId: acc.externalId,
          currency: acc.currency,
          name: acc.name,
          type: integration.type,
          organizations: { connect: { id: integration.organizationId } },
        },
      }),
    ),
  );

export const saveAds = async (
  integration: Integration,
  ads: ChannelAd[],
  adAccountId: string,
  adExternalIdMap: Map<string, string>,
): Promise<void> => {
  logger.info('Saving %d ads for %s', ads.length, adAccountId);
  await Promise.all(
    ads.map((channelAd) =>
      prisma.ad
        .upsert({
          select: { id: true },
          create: {
            externalId: channelAd.externalId,
            name: channelAd.name,
            adAccount: {
              connect: {
                integrationId_externalId: {
                  integrationId: integration.id,
                  externalId: channelAd.externalAdAccountId,
                },
              },
            },
          },
          update: {
            name: channelAd.name,
          },
          where: {
            adAccountId_externalId: {
              adAccountId,
              externalId: channelAd.externalId,
            },
          },
        })
        .then(({ id }) => adExternalIdMap.set(channelAd.externalId, id)),
    ),
  );
  logger.info('Saved %d ads for %s', ads.length, adAccountId);
};

export const saveInsights = async (
  insights: ChannelInsight[],
  adExternalIdMap: Map<string, string>,
  dbAccount: AdAccount,
): Promise<void> => {
  logger.info('Saving %d insights for %s', insights.length, dbAccount.id);
  await prisma.insight.createMany({
    data: insights.map((insight) => ({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know the external id exists
      adId: adExternalIdMap.get(insight.externalAdId)!,
      adAccountId: dbAccount.id,
      currency: dbAccount.currency,
      date: insight.date,
      device: insight.device,
      impressions: insight.impressions,
      position: insight.position,
      publisher: insight.publisher,
      spend: insight.spend,
    })),
  });
  logger.info('Saved %d insights for %s', insights.length, dbAccount.id);
};

export const deleteOldInsights = async (adAccountId: string, initial: boolean): Promise<void> => {
  const gte = (async () => {
    if (initial) {
      return getBeforeXMonths();
    }
    const latestInsight = await prisma.insight.findFirst({
      select: { date: true },
      where: { adAccountId },
      orderBy: { date: 'desc' },
    });
    return latestInsight ? getYesterday(latestInsight.date) : getYesterday();
  })();
  await prisma.insight.deleteMany({
    where: {
      adAccountId,
      date: { gte: await gte },
    },
  });
};
