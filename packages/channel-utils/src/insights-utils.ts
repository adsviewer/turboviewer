import { type AdAccount, type Integration, Prisma, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { AError, getBeforeXMonths, getYesterday, isAError } from '@repo/utils';
import type { ChannelAd, ChannelAdAccount, ChannelInsight } from './channel-interface';

export const saveAccounts = async (
  activeAccounts: ChannelAdAccount[],
  integration: Integration,
): Promise<AdAccount[]> =>
  await Promise.all(
    activeAccounts.map((acc) =>
      prisma.adAccount.upsert({
        where: {
          externalId_type: {
            type: integration.type,
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
                externalId_type: {
                  type: integration.type,
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
  const createInsights = await prisma.insight
    .createMany({
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
    })
    .catch((e: unknown) => {
      logger.error(
        e,
        'Error saving insights with dates: %o',
        insights.map((i) => i.date),
      );
      return new AError(`Error saving insights for ${dbAccount.id}`);
    });
  if (!isAError(createInsights)) logger.info('Saved %d insights for %s', insights.length, dbAccount.id);
};

export const deleteOldInsights = async (adAccountId: string, initial: boolean): Promise<void> => {
  const gteP = (async () => {
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
  const gte = await gteP;
  logger.info(`Deleting insights for ${adAccountId}, after ${String(gte)}`);
  await prisma.insight.deleteMany({
    where: {
      adAccountId,
      date: { gte },
    },
  });
};

export const adAccountWithIntegration = Prisma.validator<Prisma.AdAccountDefaultArgs>()({
  include: { integration: true },
});
export type AdAccountWithIntegration = Prisma.AdAccountGetPayload<typeof adAccountWithIntegration>;
