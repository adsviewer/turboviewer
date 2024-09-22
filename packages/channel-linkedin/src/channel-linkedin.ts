import { URLSearchParams } from 'node:url';
import {
  type AdAccount,
  CurrencyEnum,
  DeviceEnum,
  type Integration,
  IntegrationTypeEnum,
  prisma,
  PublisherEnum,
} from '@repo/database';
import { addInterval, AError, extractDate, isAError } from '@repo/utils';
import { z, type ZodTypeAny } from 'zod';
import { logger } from '@repo/logger';
import { AuthClient, RestliClient } from 'linkedin-api-client';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import {
  type AdAccountWithIntegration,
  type AdWithAdAccount,
  authEndpoint,
  type ChannelAd,
  type ChannelAdAccount,
  type ChannelAdSet,
  type ChannelCampaign,
  type ChannelIFrame,
  type ChannelInsight,
  type ChannelInterface,
  deleteOldInsights,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  getIFrame,
  JobStatusEnum,
  markErrorIntegrationById,
  saveAccounts,
  saveInsightsAdsAdsSetsCampaigns,
  timeRanges,
  type TokensResponse,
} from '@repo/channel-utils';
import { env } from './config';

const authClient = new AuthClient({
  clientId: env.LINKEDIN_APPLICATION_ID,
  clientSecret: env.LINKEDIN_APPLICATION_SECRET,
  redirectUrl: `${env.API_ENDPOINT}${authEndpoint}`,
});

const restliClient = new RestliClient();
const versionString = '202408';
const baseUrl = 'https://api.linkedin.com';

class LinkedIn implements ChannelInterface {
  generateAuthUrl(state: string): GenerateAuthUrlResp {
    const scopes = ['r_basicprofile', 'r_ads', 'r_ads_reporting'];
    return { url: authClient.generateMemberAuthorizationUrl(scopes, state) };
  }

  async exchangeCodeForTokens(code: string): Promise<TokensResponse | AError> {
    const tokens = await authClient.exchangeAuthCodeForAccessToken(code);
    return {
      accessToken: tokens.access_token,
      accessTokenExpiresAt: addInterval(new Date(), 'seconds', tokens.expires_in),
      refreshToken: tokens.refresh_token,
      refreshTokenExpiresAt: tokens.refresh_token_expires_in
        ? addInterval(new Date(), 'seconds', tokens.refresh_token_expires_in)
        : undefined,
    };
  }

  async getUserId(accessToken: string): Promise<string | AError> {
    const response = await restliClient.get({ resourcePath: '/me', accessToken });

    if (response.status !== 200) {
      return new AError('Failed to fetch user');
    }
    const parsed = z.object({ id: z.string() }).safeParse(response.data);
    if (!parsed.success) {
      return new AError('Failed to fetch user');
    }
    return parsed.data.id;
  }

  signOutCallback(_req: ExpressRequest, res: ExpressResponse): void {
    logger.error(`LinkedIn does not support a signout callback`);
    res.status(200).send('OK');
  }

  async deAuthorize(organizationId: string): Promise<string | AError> {
    const integration = await getConnectedIntegrationByOrg(organizationId, IntegrationTypeEnum.LINKEDIN);
    if (!integration) return new AError('No integration found');
    if (isAError(integration)) return integration;

    const response = await fetch('https://www.linkedin.com/oauth/v2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.LINKEDIN_APPLICATION_ID,
        client_secret: env.LINKEDIN_APPLICATION_SECRET,
        token: integration.accessToken,
      }),
    }).catch((error: unknown) => {
      logger.error('Failed to de-authorize %o', { error });
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    });

    if (response instanceof Error) return response;
    if (!response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
      const json = await response.json();
      const error = LinkedIn.parseDeAuthRequest(json);
      logger.error(error, 'De-authorization request failed');
      if (await disConnectIntegrationOnError(integration.id, error, false)) {
        return integration.externalId;
      }
      return error;
    }

    return integration.externalId;
  }

  async getChannelData(integration: Integration, initial: boolean): Promise<AError | undefined> {
    const dbAccounts = await this.saveAdAccounts(integration);
    if (isAError(dbAccounts)) return dbAccounts;

    for (const dbAccount of dbAccounts) {
      const ranges = await timeRanges(initial, dbAccount.id);
      for (const range of ranges) {
        const analytics = await this.getAdAnalytics(integration, range, dbAccount);
        if (isAError(analytics)) return analytics;

        const campaigns = await this.getCampaignGroupsAsCampaigns(integration, analytics.campaignGroupIds, dbAccount);
        if (isAError(campaigns)) return campaigns;

        const adSets = await this.getCampaignsAsAdSets(
          integration,
          new Set(Array.from(analytics.campaignIds).map((c) => c.externalCampaignId)),
          dbAccount,
        );
        if (isAError(adSets)) return adSets;
        const ads: ChannelAd[] = Array.from(analytics.creativeIds).map((c) => ({
          externalAdAccountId: dbAccount.externalId,
          externalId: c.externalCreativeId,
          externalAdSetId: c.externalCampaignId,
        }));
        await deleteOldInsights(dbAccount.id, range.since, range.until);
        await saveInsightsAdsAdsSetsCampaigns(
          campaigns,
          new Map<string, string>(),
          dbAccount,
          adSets,
          new Map<string, string>(),
          ads,
          new Map<string, string>(),
          analytics.insights,
        );
      }
    }
    return Promise.resolve(undefined);
  }

  async getAdPreview(integration: Integration, adId: string): Promise<ChannelIFrame | AError> {
    const { externalId, adAccount } = await prisma.ad.findUniqueOrThrow({
      include: { adAccount: true },
      where: { id: adId },
    });
    const params = {
      q: 'creative',
      creative: encodeURIComponent(`urn:li:sponsoredCreative:${externalId}`),
      account: encodeURIComponent(`urn:li:sponsoredAccount:${adAccount.externalId}`),
    };
    const adPreview = await LinkedIn.handlePagination(
      integration,
      `/adPreviews?${queryParams(params)}`,
      z.object({ preview: z.string() }),
    );
    if (isAError(adPreview)) return adPreview;
    if (adPreview.length !== 1) return new AError('getAdPreview: Elements should contain only one element');
    return getIFrame(adPreview[0].preview);
  }

  getDefaultPublisher(): PublisherEnum {
    return PublisherEnum.Facebook;
  }

  async saveAdAccounts(integration: Integration): Promise<AError | AdAccount[]> {
    const adAccountSchema = z.object({
      test: z.boolean(),
      type: z.enum(['BUSINESS', 'ENTERPRISE']),
      reference: z.string().optional(),
      status: z.enum(['ACTIVE', 'CANCELED', 'DRAFT', 'PENDING_DELETION', 'REMOVED']),
      id: z.number().int(),
      servingStatuses: z.array(
        z.enum([
          'RUNNABLE',
          'BILLING_HOLD',
          'STOPPED',
          'ACCOUNT_TOTAL_BUDGET_HOLD',
          'ACCOUNT_END_DATE_HOLD',
          'RESTRICTED_HOLD',
          'INTERNAL_HOLD',
        ]),
      ),
      name: z.string(),
      currency: z.nativeEnum(CurrencyEnum),
    });
    const adAccounts = await LinkedIn.handlePagination(
      integration,
      '/adAccounts?q=search&search=(status:(values:List(ACTIVE)))',
      adAccountSchema,
    );
    if (isAError(adAccounts)) return adAccounts;
    const channelAccounts = adAccounts.map((a) => ({
      externalId: a.id.toString(),
      name: a.name,
      currency: a.currency,
    })) satisfies ChannelAdAccount[];

    return await saveAccounts(channelAccounts, integration);
  }

  async saveOldInsightsAdsAdsSetsCampaigns(
    integration: Integration,
    groupByAdAccount: Map<string, AdWithAdAccount[]>,
  ): Promise<undefined | AError> {
    for (const [_, accountAds] of groupByAdAccount) {
      const adAccount = accountAds[0].adAccount;
      const creatives = await this.getCreativesAsAds(
        integration,
        new Set(accountAds.map((a) => a.externalId)),
        adAccount.externalId,
      );
      if (isAError(creatives)) return creatives;
      const adSetIds = new Set(creatives.map((c) => c.externalAdSetId));
      const adSets = await this.getCampaignsAsAdSets(integration, adSetIds, adAccount);
      if (isAError(adSets)) return adSets;
      const campaigns = await this.getCampaignGroupsAsCampaigns(
        integration,
        new Set(adSets.map((a) => a.externalCampaignId)),
        adAccount,
      );
      if (isAError(campaigns)) return campaigns;
      await saveInsightsAdsAdsSetsCampaigns(
        campaigns,
        new Map<string, string>(),
        adAccount,
        adSets,
        new Map<string, string>(),
        creatives,
        new Map<string, string>(),
        [],
      );
    }
  }

  private async getAdAnalytics(
    integration: Integration,
    range: { since: Date; until: Date },
    dbAccount: AdAccount,
  ): Promise<
    | AError
    | {
        creativeIds: Set<{ externalCreativeId: string; externalCampaignId: string }>;
        campaignIds: Set<{ externalCampaignId: string; externalCampaignGroupId: string }>;
        campaignGroupIds: Set<string>;
        insights: ChannelInsight[];
      }
  > {
    const params = {
      q: 'statistics',
      pivots: 'List(CAMPAIGN_GROUP,CAMPAIGN,CREATIVE,IMPRESSION_DEVICE_TYPE)',
      timeGranularity: 'DAILY',
      accounts: `List(${encodeURIComponent(`urn:li:sponsoredAccount:${dbAccount.externalId}`)})`,
      dateRange: linkedInTimeRange(range),
      fields: 'clicks,impressions,pivotValues,costInLocalCurrency,dateRange',
    };
    const adAnalytics = await LinkedIn.handlePagination(
      integration,
      `/adAnalytics?${queryParams(params)}`,
      z.object({
        clicks: z.number().int(),
        impressions: z.number().int(),
        costInLocalCurrency: z.coerce.number(),
        pivotValues: z.array(z.string()),
        dateRange: z.object({
          start: z.object({ year: z.number().int(), month: z.number().int(), day: z.number().int() }),
          end: z.object({ year: z.number().int(), month: z.number().int(), day: z.number().int() }),
        }),
      }),
    );
    if (isAError(adAnalytics)) return adAnalytics;
    const creativeIds = new Set<{ externalCreativeId: string; externalCampaignId: string }>();
    const campaignIds = new Set<{ externalCampaignId: string; externalCampaignGroupId: string }>();
    const campaignGroupIds = new Set<string>();
    const insights: ChannelInsight[] = adAnalytics
      .map((a) => {
        const creativeExternalId = a.pivotValues.find((v) => v.startsWith('urn:li:sponsoredCreative:'))?.split(':')[3];
        const campaignExternalId = a.pivotValues.find((v) => v.startsWith('urn:li:sponsoredCampaign:'))?.split(':')[3];
        const campaignGroupExternalId = a.pivotValues
          .find((v) => v.startsWith('urn:li:sponsoredCampaignGroup:'))
          ?.split(':')[3];
        if (!creativeExternalId || !campaignExternalId || !campaignGroupExternalId) return undefined;
        creativeIds.add({ externalCreativeId: creativeExternalId, externalCampaignId: campaignExternalId });
        campaignIds.add({ externalCampaignId: campaignExternalId, externalCampaignGroupId: campaignGroupExternalId });
        campaignGroupIds.add(campaignGroupExternalId);
        const device = a.pivotValues.find((v) => Array.from(LinkedIn.deviceEnumMap.keys()).includes(v));
        return {
          externalAdId: creativeExternalId,
          date: new Date(a.dateRange.start.year, a.dateRange.start.month - 1, a.dateRange.start.day),
          externalAccountId: dbAccount.externalId,
          impressions: a.impressions,
          clicks: a.clicks,
          spend: a.costInLocalCurrency * 100,
          device: device ? (LinkedIn.deviceEnumMap.get(device) ?? DeviceEnum.Unknown) : DeviceEnum.Unknown,
          publisher: PublisherEnum.LinkedIn,
          position: 'feed',
        };
      })
      .flatMap((i) => (i ? [i] : []));
    return { creativeIds, campaignIds, campaignGroupIds, insights };
  }

  private async getCreativesAsAds(
    integration: Integration,
    creativeIds: Set<string>,
    externalAdAccountId: string,
  ): Promise<AError | ChannelAd[]> {
    const creatives = await LinkedIn.handlePagination(
      integration,
      `/adAccounts/${externalAdAccountId}/creatives?creatives=List(${Array.from(creativeIds)
        .map((c) => `urn%3Ali%3AsponsoredCreative%3A${c}`)
        .join(',')})&q=criteria`,
      z.object({ id: z.string(), campaign: z.string() }),
    );
    if (isAError(creatives)) return creatives;
    return creatives.map((c) => ({
      externalId: c.id.split(':')[3],
      externalAdSetId: c.campaign.split(':')[3],
      externalAdAccountId,
    }));
  }

  private static async handlePagination<T extends ZodTypeAny>(
    integration: Integration,
    queryParams: string,
    schema: T,
  ): Promise<AError | z.infer<typeof schema>[]> {
    const headers = {
      'LinkedIn-Version': versionString,
      'X-Restli-Protocol-Version': '2.0.0',
      Authorization: `Bearer ${integration.accessToken}`,
    };
    const res: T[] = [];
    const responseP = fetch(`${baseUrl}/rest${queryParams}`, {
      headers,
    });
    const response = await LinkedIn.parseLinkedInResponse(integration.id, responseP, schema);
    if (isAError(response)) return response;
    res.push(...response.elements);
    let next = response.next;
    while (next) {
      const nextResponse = fetch(`${baseUrl}${next.href}`, {
        headers,
      });
      const nextResponseParsed = await LinkedIn.parseLinkedInResponse(integration.id, nextResponse, schema);
      if (isAError(nextResponseParsed)) return nextResponseParsed;
      res.push(...nextResponseParsed.elements);
      next = nextResponseParsed.next;
    }
    return res;
  }

  private static async parseLinkedInResponse<T extends ZodTypeAny>(
    integrationId: string,
    responseP: Promise<Response>,
    schema: T,
  ): Promise<AError | { next: { rel: string; href: string } | undefined; elements: T[] }> {
    const response = await responseP.catch(async (error: unknown) => {
      if (error instanceof Error) {
        await disConnectIntegrationOnError(integrationId, error, true);
      }
      logger.error(error, 'Failed to fetch data in parseLinkedInResponse');
      return new AError('Failed to fetch data');
    });
    if (isAError(response)) return response;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const body = await response.json();
    if (!response.ok) {
      const linkedInErrorSchema = z.object({
        status: z.number(),
        serviceErrorCode: z.number(),
        code: z.string(),
        message: z.string(),
      });
      const parsed = linkedInErrorSchema.safeParse(body);
      if (!parsed.success) {
        logger.error(body, 'Unknown linkedIn error');
        return new AError('Unknown linkedIn error');
      }
      if (parsed.data.code === 'EXPIRED_ACCESS_TOKEN') {
        await disConnectIntegrationOnError(integrationId, new Error(parsed.data.message), true);
        return new AError('Expired access token');
      }
      logger.error(body, 'Unknown error code in LinkedIn response');
      return new AError('Unknown error code in LinkedIn response');
    }
    const bigSchema = z.object({
      elements: schema.array(),
      paging: z
        .object({
          links: z.array(z.object({ rel: z.string(), href: z.string() })),
        })
        .optional(),
    });
    const parsed = bigSchema.safeParse(body);
    if (!parsed.success) {
      const msg = 'Failed to parse data in linkedIn pagination call';
      logger.error(parsed.error, msg);
      return new AError(msg);
    }
    const next = parsed.data.paging?.links.find((l) => l.rel === 'next') ?? undefined;
    return { next, elements: parsed.data.elements };
  }

  private static parseDeAuthRequest(json: unknown): AError {
    const errorSchema = z.object({
      serviceErrorCode: z.number(),
      message: z.string(),
      status: z.number(),
    });
    const parsed = errorSchema.safeParse(json);
    if (!parsed.success) {
      const errorSchema2 = z.object({
        error: z.string(),
        error_description: z.string(),
      });
      const parsed2 = errorSchema2.safeParse(json);
      if (!parsed2.success) {
        logger.error('De-authorization request failed due to %o', json);
        return new AError('Failed to de-authorize');
      }
      return new AError(parsed2.data.error_description);
    }
    return new AError(parsed.data.message);
  }

  private static deviceEnumMap: Map<string, DeviceEnum> = new Map<string, DeviceEnum>([
    ['MOBILE_APP', DeviceEnum.MobileApp],
    ['MOBILE_WEB', DeviceEnum.MobileWeb],
    ['DESKTOP_WEB', DeviceEnum.Desktop],
  ]);

  getReportStatus(_adAccount: AdAccountWithIntegration, _taskId: string): Promise<JobStatusEnum> {
    return Promise.resolve(JobStatusEnum.FAILED);
  }

  processReport(
    _adAccount: AdAccountWithIntegration,
    _taskId: string,
    _since: Date,
    _until: Date,
  ): Promise<AError | undefined> {
    return Promise.resolve(new AError('Not implemented'));
  }

  runAdInsightReport(
    _adAccount: AdAccount,
    _integration: Integration,
    _since: Date,
    _until: Date,
  ): Promise<string | AError> {
    return Promise.resolve(new AError('Not implemented'));
  }

  getType(): IntegrationTypeEnum {
    return IntegrationTypeEnum.LINKEDIN;
  }

  private async getCampaignGroupsAsCampaigns(
    integration: Integration,
    campaignGroupIds: Set<string>,
    dbAccount: AdAccount,
  ): Promise<AError | ChannelCampaign[]> {
    if (campaignGroupIds.size === 0) return [];
    const campaignGroups = await LinkedIn.handlePagination(
      integration,
      `/adAccounts/${dbAccount.externalId}/adCampaignGroups?q=search&search=(id:(values:List(${Array.from(
        campaignGroupIds,
      )
        .map((c) => `urn%3Ali%3AsponsoredCampaignGroup%3A${c}`)
        .join(',')})))`,
      z.object({ id: z.number().int(), name: z.string() }),
    );
    if (isAError(campaignGroups)) return campaignGroups;
    return campaignGroups.map((c) => ({
      externalId: String(c.id),
      name: c.name,
      externalAdAccountId: dbAccount.externalId,
    }));
  }

  private async getCampaignsAsAdSets(
    integration: Integration,
    campaignIds: Set<string>,
    dbAccount: AdAccount,
  ): Promise<AError | ChannelAdSet[]> {
    if (campaignIds.size === 0) return [];
    const campaigns = await LinkedIn.handlePagination(
      integration,
      `/adAccounts/${dbAccount.externalId}/adCampaigns?q=search&search=(id:(values:List(${Array.from(campaignIds)
        .map((c) => `urn%3Ali%3AsponsoredCampaign%3A${c}`)
        .join(',')})))`,
      z.object({ id: z.number().int(), name: z.string(), campaignGroup: z.string() }),
    );
    if (isAError(campaigns)) return campaigns;
    return campaigns.map((c) => ({
      externalId: String(c.id),
      name: c.name,
      externalCampaignId: c.campaignGroup.split(':')[3],
    }));
  }
}

const disConnectIntegrationOnError = async (integrationId: string, error: Error, notify: boolean): Promise<boolean> => {
  const revocableMessages = [
    'Empty oauth2 access token',
    'The token used in the request has been revoked by the user',
    'The token used in the request has expired',
    'The provided authorization grant or refresh token is invalid, expired or revoked.',
  ];
  if (revocableMessages.includes(error.message)) {
    await markErrorIntegrationById(integrationId, notify);
    return true;
  }
  return false;
};

const linkedInTimeRange = ({ since, until }: { since: Date; until: Date }): string => {
  const { year: yearSince, month: monthSince, day: daySince } = extractDate(since);
  const { year: yearUntil, month: monthUntil, day: dayUntil } = extractDate(until);
  return `(start:(year:${String(yearSince)},month:${monthSince},day:${daySince}),end:(year:${String(yearUntil)},month:${String(monthUntil)},day:${String(dayUntil)}))`;
};

const queryParams = (params: Record<string, string>): string => {
  const qParams = Object.entries(params).reduce<string[]>((acc, [key, value]) => {
    acc.push(`${key}=${value}`);
    return acc;
  }, []);
  return qParams.join('&');
};

export const linkedIn = new LinkedIn();
