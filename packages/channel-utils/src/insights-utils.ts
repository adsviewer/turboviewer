import {
  type AdAccount,
  type CurrencyEnum,
  type DeviceEnum,
  type Integration,
  type IntegrationTypeEnum,
  Prisma,
  prisma,
  type PublisherEnum,
} from '@repo/database';
import { logger } from '@repo/logger';
import { AError, isAError } from '@repo/utils';
import _ from 'lodash';
import type {
  ChannelAd,
  ChannelAdAccount,
  ChannelAdSet,
  ChannelCampaign,
  ChannelCreative,
  ChannelInsight,
} from './channel-interface';
import { currencyToEuro } from './currency-to-eur-cacheable';

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
        update: {
          currency: acc.currency,
          name: acc.name,
          organizations: {
            connect: { id: integration.organizationId },
          },
        },
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

const saveCampaigns = async (
  campaigns: ChannelCampaign[],
  adAccountId: string,
  externalCampaignToIdMap: Map<string, string>,
): Promise<void> => {
  logger.info('Saving %d campaigns', campaigns.length);
  await Promise.all(
    campaigns.map((campaign) =>
      prisma.campaign
        .upsert({
          where: {
            adAccountId_externalId: {
              adAccountId,
              externalId: campaign.externalId,
            },
          },
          update: {
            name: campaign.name,
          },
          create: {
            adAccountId,
            externalId: campaign.externalId,
            name: campaign.name,
          },
        })
        .then(({ id }) => externalCampaignToIdMap.set(campaign.externalId, id)),
    ),
  );
};

const saveAdSets = async (
  adSets: ChannelAdSet[],
  externalCampaignToIdMap: Map<string, string>,
  externalAdSetToIdMap: Map<string, string>,
): Promise<void> => {
  logger.info('Saving %d ad sets', adSets.length);
  await Promise.all(
    adSets.map((adSet) =>
      prisma.adSet
        .upsert({
          where: {
            campaignId_externalId: {
              campaignId: externalCampaignToIdMap.get(adSet.externalCampaignId) ?? '',
              externalId: adSet.externalId,
            },
          },
          update: {
            name: adSet.name,
          },
          create: {
            campaignId: externalCampaignToIdMap.get(adSet.externalCampaignId) ?? '',
            externalId: adSet.externalId,
            name: adSet.name,
          },
        })
        .then(({ id }) => externalAdSetToIdMap.set(adSet.externalId, id)),
    ),
  );
};

const saveAds = async (
  ads: ChannelAd[],
  adAccountId: string,
  adExternalIdMap: Map<string, string>,
  externalAdSetToIdMap: Map<string, string>,
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
                id: adAccountId,
              },
            },
            adSet: {
              connect: {
                id: externalAdSetToIdMap.get(channelAd.externalAdSetId) ?? '',
              },
            },
          },
          update: {
            name: channelAd.name,
            adSet: {
              connect: {
                id: externalAdSetToIdMap.get(channelAd.externalAdSetId) ?? '',
              },
            },
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

export const saveCreatives = async (
  creatives: ChannelCreative[],
  adAccountId: string,
  adExternalIdMap: Map<string, string>,
  creativeExternalIdMap: Map<string, string>,
): Promise<void> => {
  const uniqueCreatives = _.uniqBy(creatives, (creative) => creative.externalId);
  logger.info('Saving %d creatives', uniqueCreatives.length);
  await Promise.all(
    uniqueCreatives.map((creative) =>
      prisma.creative
        .upsert({
          where: { externalId_adAccountId: { externalId: creative.externalId, adAccountId } },
          create: {
            externalId: creative.externalId,
            adAccountId,
            name: creative.name,
            body: creative.body,
            title: creative.title,
            status: creative.status,
            callToActionType: creative.callToActionType,
            imageUrl: creative.imageUrl,
            ads: { connect: { id: adExternalIdMap.get(creative.externalAdId) ?? '' } },
          },
          update: {
            name: creative.name,
            body: creative.body,
            title: creative.title,
            status: creative.status,
            callToActionType: creative.callToActionType,
            imageUrl: creative.imageUrl,
          },
        })
        .then(({ id }) => creativeExternalIdMap.set(creative.externalId, id)),
    ),
  );
};

const saveInsights = async (
  insights: ChannelInsight[],
  adExternalIdMap: Map<string, string>,
  dbAccount: AdAccount,
): Promise<void> => {
  logger.info('Saving %d insights for %s', insights.length, dbAccount.id);
  const toEuro = await currencyToEuro
    .getValue(dbAccount.currency, dbAccount.currency)
    .then((rate) => (isAError(rate) ? null : 1 / rate));

  const createInsights = await prisma.insight
    .createMany({
      data: insights.map((insight) => {
        const spend = Math.floor(insight.spend);
        return {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know the external id exists
          adId: adExternalIdMap.get(insight.externalAdId)!,
          adAccountId: dbAccount.id,
          currency: dbAccount.currency,
          date: insight.date,
          device: insight.device,
          impressions: insight.impressions,
          position: insight.position,
          publisher: insight.publisher,
          spend,
          spendEur: toEuro ? Math.floor(spend * toEuro) : null,
        };
      }),
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

export const deleteOldInsights = async (adAccountId: string, since: Date, until: Date): Promise<void> => {
  logger.info(`Deleting insights for ${adAccountId}, since ${since.toISOString()} until ${until.toISOString()}`);
  await prisma.insight.deleteMany({
    where: {
      adAccountId,
      date: { gte: since, lte: until },
    },
  });
};

export const adAccountWithIntegration = Prisma.validator<Prisma.AdAccountDefaultArgs>()({
  include: { integration: true },
});
export type AdAccountWithIntegration = Prisma.AdAccountGetPayload<typeof adAccountWithIntegration>;

export const adWithAdAccount = Prisma.validator<Prisma.AdDefaultArgs>()({
  include: { adAccount: true },
});
export type AdWithAdAccount = Prisma.AdGetPayload<typeof adWithAdAccount>;

export const saveInsightsAdsAdsSetsCampaigns = async (
  campaigns: ChannelCampaign[],
  externalCampaignToIdMap: Map<string, string>,
  adAccount: AdAccount,
  adSets: ChannelAdSet[],
  externalAdSetToIdMap: Map<string, string>,
  ads: ChannelAd[],
  adExternalIdMap: Map<string, string>,
  creatives: ChannelCreative[],
  creativeExternalIdMap: Map<string, string>,
  insights: ChannelInsight[],
): Promise<void> => {
  const uniqueCampaigns = _.uniqBy(campaigns, (campaign) => campaign.externalId);
  const newCampaigns = uniqueCampaigns.filter((campaign) => !externalCampaignToIdMap.has(campaign.externalId));
  await saveCampaigns(newCampaigns, adAccount.id, externalCampaignToIdMap);

  const uniqueAdSets = _.uniqBy(adSets, (adSet) => adSet.externalId);
  const newAdSets = uniqueAdSets.filter((adSet) => !externalAdSetToIdMap.has(adSet.externalId));
  await saveAdSets(newAdSets, externalCampaignToIdMap, externalAdSetToIdMap);

  const uniqueAds = _.uniqBy(ads, (ad) => ad.externalId);
  const newAds = uniqueAds.filter((ad) => !adExternalIdMap.has(ad.externalId));
  await saveAds(newAds, adAccount.id, adExternalIdMap, externalAdSetToIdMap);
  await saveCreatives(creatives, adAccount.id, adExternalIdMap, creativeExternalIdMap);

  await saveInsights(insights, adExternalIdMap, adAccount);
};

export interface GroupedInsightsWithEdges {
  hasNext: boolean;
  page: number;
  pageSize: number;
  edges: GroupedInsightWithDetails[];
}

interface GroupedInsightWithDetails {
  id: string;
  adId?: string | null;
  adAccountId?: string | null;
  adSetId?: string | null;
  campaignId?: string | null;
  currency: CurrencyEnum;
  device?: DeviceEnum | null;
  publisher?: PublisherEnum | null;
  position?: string | null;
  datapoints: Datapoints[];
}

interface Datapoints {
  spend: bigint;
  spendUsd?: bigint | null;
  impressions: bigint;
  cpm?: bigint | null;
  date: Date;
}

export const insightsColumnsOrderBy = [
  'spend_abs',
  'impressions_abs',
  'cpm_abs',
  'spend_rel',
  'impressions_rel',
  'cpm_rel',
] as const;

type InsightsColumnsOrderByType = (typeof insightsColumnsOrderBy)[number];
type InsightsPositionType =
  | 'an_classic'
  | 'biz_disco_feed'
  | 'facebook_reels'
  | 'facebook_reels_overlay'
  | 'facebook_stories'
  | 'feed'
  | 'instagram_explore'
  | 'instagram_explore_grid_home'
  | 'instagram_profile_feed'
  | 'instagram_reels'
  | 'instagram_search'
  | 'instagram_stories'
  | 'instream_video'
  | 'marketplace'
  | 'messenger_inbox'
  | 'messenger_stories'
  | 'rewarded_video'
  | 'right_hand_column'
  | 'search'
  | 'video_feeds'
  | 'unknown';

export const insightsColumnsGroupBy = [
  'adAccountId',
  'adId',
  'adSetId',
  'campaignId',
  'device',
  'position',
  'publisher',
  'integration',
] as const;
export type InsightsColumnsGroupByType = (typeof insightsColumnsGroupBy)[number];

export enum InsightsSearchField {
  AdName = 'a.name',
  AccountName = 'aa.name',
  AdSetName = 'ase.name',
  CampaignName = 'c.name',
}
export enum InsightsSearchOperator {
  Contains = 'contains',
  StartsWith = 'startsWith',
  Equals = 'equals',
}

export interface InsightsSearchTerm {
  field: InsightsSearchField;
  operator: InsightsSearchOperator;
  value: string;
}

export interface InsightsSearchExpression {
  and?: InsightsSearchExpression[] | null;
  or?: InsightsSearchExpression[] | null;
  term?: InsightsSearchTerm | null;
}

export interface FilterInsightsInputType {
  adAccountIds?: string[] | null;
  adIds?: string[] | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  devices?: DeviceEnum[] | null;
  groupBy?: InsightsColumnsGroupByType[] | null;
  interval: 'day' | 'week' | 'month' | 'quarter';
  integrations?: IntegrationTypeEnum[] | IntegrationTypeEnum | null;
  order?: 'asc' | 'desc' | null;
  orderBy: InsightsColumnsOrderByType;
  page: number;
  pageSize: number;
  positions?: InsightsPositionType[] | null;
  publishers?: PublisherEnum[] | null;
  search?: InsightsSearchExpression | null;
}
