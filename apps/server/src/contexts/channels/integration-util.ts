import type { AdAccount, Integration, IntegrationTypeEnum } from '@repo/database';
import { IntegrationStatus, prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { env } from '../../config';
import { decryptAesGcm } from '../../utils/aes-util';
import type { ChannelAd, ChannelAdAccount, ChannelInsight } from './channel-interface';

export const authEndpoint = '/channel/auth';

export type AdAccountEssential = Pick<AdAccount, 'id' | 'externalId' | 'currency'>;

export const revokeIntegration = async (externalId: string, type: IntegrationTypeEnum): Promise<void> => {
  await prisma.integration.update({
    where: {
      externalId_type: {
        externalId,
        type,
      },
    },
    data: {
      status: IntegrationStatus.REVOKED,
    },
  });
};

export const getConnectedIntegrationByOrg = async (
  organizationId: string,
  type: IntegrationTypeEnum,
): Promise<Integration | null> => {
  return await prisma.integration
    .findUnique({
      where: {
        organizationId_type: {
          organizationId,
          type,
        },
        status: IntegrationStatus.CONNECTED,
      },
    })
    .then(decryptTokens);
};

export const getAllConnectedIntegrations = async (): Promise<Integration[]> => {
  return await prisma.integration
    .findMany({
      where: {
        status: IntegrationStatus.CONNECTED,
      },
    })
    .then((integrations) => integrations.map(decryptTokens).flatMap((integration) => integration ?? []));
};

export const decryptTokens = (integration: Integration | null): null | Integration => {
  if (integration) {
    const accessToken = decryptAesGcm(integration.accessToken, env.CHANNEL_SECRET);
    if (typeof accessToken !== 'string') {
      logger.warn(`Failed to decrypt access token for integration ${integration.id}`);
      return null;
    }
    integration.accessToken = accessToken;
    if (integration.refreshToken) {
      const refreshToken = decryptAesGcm(integration.refreshToken, env.CHANNEL_SECRET);
      if (typeof refreshToken !== 'string') return null;
      integration.refreshToken = refreshToken;
    }
  }
  return integration;
};

export const saveAccounts = async (activeAccounts: ChannelAdAccount[], integration: Integration) =>
  await Promise.all(
    activeAccounts.map((acc) =>
      prisma.adAccount.upsert({
        select: { id: true, externalId: true, currency: true },
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
  logger.info('Saving ads for %s', integration.id);
  for (const channelAd of ads) {
    const { id } = await prisma.ad.upsert({
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
    });
    adExternalIdMap.set(channelAd.externalId, id);
  }
};

export const saveInsights = async (
  insightsByExternalAdId: Map<string, ChannelInsight[]>,
  adExternalIdMap: Map<string, string>,
  dbAccount: AdAccountEssential,
) => {
  for (const groupedInsights of Array.from(insightsByExternalAdId.values())) {
    for (const insight of groupedInsights) {
      const adId = adExternalIdMap.get(insight.externalAdId);
      if (!adId) continue;
      await prisma.insight.upsert({
        where: {
          adId_date_device_publisher_position: {
            adId,
            date: insight.date,
            device: insight.device,
            publisher: insight.publisher,
            position: insight.position,
          },
        },
        update: {
          adAccountId: dbAccount.id,
          currency: dbAccount.currency,
          impressions: insight.impressions,
          spend: insight.spend,
        },
        create: {
          adAccountId: dbAccount.id,
          adId,
          currency: dbAccount.currency,
          date: insight.date,
          impressions: insight.impressions,
          spend: insight.spend,
          device: insight.device,
          publisher: insight.publisher,
          position: insight.position,
        },
      });
    }
  }
};
