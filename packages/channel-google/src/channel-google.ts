import { createHmac } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import { OAuth2Client } from 'google-auth-library';
import {
  type AdAccount as DbAdAccount,
  CurrencyEnum,
  DeviceEnum,
  type Integration,
  IntegrationTypeEnum,
  prisma,
  PublisherEnum,
} from '@repo/database';
import { AError, FireAndForget, formatYYYMMDDDate, isAError } from '@repo/utils';
import { z, type ZodTypeAny } from 'zod';
import { logger } from '@repo/logger';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import * as adsSdk from 'facebook-nodejs-business-sdk';
import {
  Ad,
  AdAccount,
  AdAccountAdVolume,
  AdCreative,
  AdPreview,
  AdReportRun,
  AdsInsights,
  User,
} from 'facebook-nodejs-business-sdk';
import type Cursor from 'facebook-nodejs-business-sdk/src/cursor';
import {
  type AdAccountWithIntegration,
  adReportsStatusesToRedis,
  type AdWithAdAccount,
  authEndpoint,
  type ChannelAd,
  type ChannelAdAccount,
  type ChannelAdSet,
  type ChannelCampaign,
  type ChannelCreative,
  type ChannelIFrame,
  type ChannelInsight,
  type ChannelInterface,
  deleteOldInsights,
  formatDimensionsMap,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  getIFrame,
  getIFrameAdFormat,
  isMetaAdPosition,
  JobStatusEnum,
  markErrorIntegrationById,
  // MetaError,
  revokeIntegration,
  saveAccounts,
  saveInsightsAdsAdsSetsCampaigns,
  type TokensResponse,
} from '@repo/channel-utils';
import { retry } from '@lifeomic/attempt';
// import { decode } from 'jsonwebtoken';
import { decode, type JwtPayload } from 'jsonwebtoken';
import { GoogleAdsApi } from 'google-ads-api';
import { env } from './config';

const fireAndForget = new FireAndForget();

const apiVersion = 'v20.0';
export const baseOauthFbUrl = `https://www.facebook.com/${apiVersion}`;
export const baseGraphFbUrl = `https://graph.facebook.com/${apiVersion}`;

interface CustomerClient {
  resourceName: string;
  clientCustomer: string;
  level: string;
  manager: boolean;
  descriptiveName: string;
}

interface GoogleAdsResult {
  customerClient: CustomerClient;
}

interface GoogleAdsResponse {
  results: GoogleAdsResult[];
  fieldMask: string;
  requestId: string;
  queryResourceConsumption: string;
}


const limit = 600;

// const authLoginEndpoint = '/auth/login/callback';

const client = new OAuth2Client(
  env.GOOGLE_CHANNEL_APPLICATION_ID,
  env.GOOGLE_CHANNEL_APPLICATION_SECRET,
  `${env.API_ENDPOINT}${authEndpoint}`,
);

const adsAPi = new GoogleAdsApi({
  client_id: env.GOOGLE_CHANNEL_APPLICATION_ID,
  client_secret: env.GOOGLE_CHANNEL_APPLICATION_SECRET,
  developer_token: env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
});

interface GoogleJwtPayload extends JwtPayload {
  azp: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string | undefined;
  family_name: string | undefined;
}

class Google implements ChannelInterface {
  private readonly insightFields = [
    AdsInsights.Fields.account_id,
    AdsInsights.Fields.ad_id,
    AdsInsights.Fields.adset_name,
    AdsInsights.Fields.adset_id,
    AdsInsights.Fields.ad_name,
    AdsInsights.Fields.campaign_name,
    AdsInsights.Fields.campaign_id,
    AdsInsights.Fields.date_start,
    AdsInsights.Fields.impressions,
    AdsInsights.Fields.inline_link_clicks, //clicks
    AdsInsights.Fields.spend,
  ];

  generateAuthUrl(state: string): GenerateAuthUrlResp {
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/adwords',
      ],
      state,
      prompt: 'consent',
    });

    return {
      url,
    };
  }

  async exchangeCodeForTokens(code: string): Promise<TokensResponse | AError> {
    const getTokenResponse = await client.getToken(code);

    const refreshToken = getTokenResponse.tokens.refresh_token;
    if (!getTokenResponse.tokens.id_token) {
      return new AError('No id_token in response');
    }

    const decoded = decode(getTokenResponse.tokens.id_token) as GoogleJwtPayload | null;
    if (!decoded) {
      return new AError('Could not decode id_token');
    }
    if (!getTokenResponse.tokens.access_token) return new AError('Could not get access_token');
    if (!getTokenResponse.tokens.refresh_token) return new AError('Could not refresh token');

    if (getTokenResponse.tokens.expiry_date) {
      return {
        accessToken: getTokenResponse.tokens.access_token,
        accessTokenExpiresAt: new Date(Date.now() + getTokenResponse.tokens.expiry_date * 1000),
        refreshToken: getTokenResponse.tokens.refresh_token,
      };
    }
    const accessTokenExpiresAt = await Google.getExpireAt(getTokenResponse.tokens.id_token);
    if (isAError(accessTokenExpiresAt)) return accessTokenExpiresAt;

    return {
      accessToken: getTokenResponse.tokens.access_token,
      accessTokenExpiresAt,
      refreshToken: getTokenResponse.tokens.refresh_token,
    };
  }

  async getUserId(accessToken: string): Promise<string | AError> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        logger.error(`Failed to fetch Google user.`);
        return new AError('Failed to fetch user');
      }

      const parsed = z.object({ id: z.string() }).safeParse(await response.json());
      if (!parsed.success) {
        logger.error('Failed to parse Google user response', parsed.error);
        return new AError('Failed to fetch user');
      }

      return parsed.data.id; // Return the user's Google ID (substitute for externalId)
    } catch (error) {
      logger.error('Error fetching Google user', error);
      return new AError('Network error while fetching user info');
    }
  }

  signOutCallback(req: ExpressRequest, res: ExpressResponse): void {
    logger.info(`sign out callback body ${JSON.stringify(req.body)}`);

    const parsedBody = z.object({ signed_request: z.string() }).safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).send('Failed to parse sign out request');
      return;
    }
    const userId = Google.parseRequest(parsedBody.data.signed_request, env.GOOGLE_CHANNEL_APPLICATION_SECRET);
    if (isAError(userId)) {
      logger.error(userId.message);
      res.status(400).send(userId.message);
      return;
    }
    fireAndForget.add(() => revokeIntegration(userId, IntegrationTypeEnum.GOOGLE));
    res.status(200).send('OK');
  }

  async deAuthorize(organizationId: string): Promise<string | AError> {
    const integration = await getConnectedIntegrationByOrg(organizationId, IntegrationTypeEnum.GOOGLE);
    if (!integration) return new AError('No integration found');
    if (isAError(integration)) return integration;

    const response = await fetch(
      `${baseGraphFbUrl}/${integration.externalId}/permissions?access_token=${integration.accessToken}`,
      {
        method: 'DELETE',
      },
    ).catch((error: unknown) => {
      logger.error('Failed to de-authorize %o', { error });
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    });

    if (response instanceof Error) return response;
    // if (!response.ok) {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    //   const json = await response.json();
    //   const fbErrorSchema = z.object({
    //     error: z.object({
    //       message: z.string(),
    //       code: z.number(),
    //       error_subcode: z.number(),
    //       fbtrace_id: z.string(),
    //     }),
    //   });
    //   const parsed = fbErrorSchema.safeParse(json);
    //   if (!parsed.success) {
    //     logger.error('De-authorization request failed due to %o', json);
    //     return new AError('Failed to de-authorize');
    //   }
    //   const googleError = new LinkedinError(
    //     parsed.data.error.message,
    //     parsed.data.error.code,
    //     parsed.data.error.error_subcode,
    //     parsed.data.error.fbtrace_id,
    //   );
    //   logger.error(googleError, 'De-authorization request failed');
    //   if (await disConnectIntegrationOnError(integration.id, googleError, false)) {
    //     return integration.externalId;
    //   }
    //   return googleError;
    // }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const data = await response.json();
    const parsed = z.object({ success: z.literal(true) }).safeParse(data);
    if (!parsed.success) {
      logger.error('Failed to de-authorize %o', data);
      return new AError('Failed to de-authorize');
    }
    return integration.externalId;
  }

  async refreshAccessToken () {
    const url = 'https://www.googleapis.com/oauth2/v3/token';
  
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', env.GOOGLE_CHANNEL_APPLICATION_ID);
    params.append('client_secret', env.GOOGLE_CHANNEL_APPLICATION_SECRET);
    params.append('refresh_token', env.GOOGLE_CHANNEL_REFRESH_TOKEN);
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Access Token:', data.access_token);
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  };
  

  async fetchGoogleAdsData (): Promise<GoogleAdsResponse[]> {
    const managerId = process.env.GOOGLE_CHANNEL_TEMP_CUSTOMER_ID;
  
    const url = `https://googleads.googleapis.com/v18/customers/${managerId}/googleAds:searchStream`;

    const accessToken: string = await this.refreshAccessToken()
    console.log('Access Token:', accessToken);
  
    const query = `
      SELECT
        customer_client.client_customer,
        customer_client.level,
        customer_client.manager,
        customer_client.descriptive_name
      FROM
        customer_client
      WHERE
        customer_client.level <= 1
    `;
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
          'login-customer-id': managerId,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Google Ads API Response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching Google Ads data:', error);
      throw error;
    }
  };

  async fetchYoutubeAds (customerId: string) {
    const url = `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`;
    const query = `
      SELECT 
        video.id, 
        video.title, 
        video.duration_millis, 
        ad_group_ad.ad.id, 
        ad_group_ad.ad.name, 
        ad_group_ad.ad.type, 
        ad_group.id, 
        ad_group.name, 
        ad_group.type, 
        campaign.id, 
        campaign.name, 
        campaign.advertising_channel_type, 
        campaign.advertising_channel_sub_type, 
        metrics.impressions, 
        metrics.clicks, 
        metrics.cost_micros, 
        metrics.video_quartile_p25_rate, 
        metrics.video_quartile_p50_rate, 
        metrics.video_quartile_p75_rate, 
        metrics.video_quartile_p100_rate, 
        metrics.video_view_rate, 
        metrics.video_views, 
        segments.ad_format_type, 
        segments.date 
      FROM video 
      WHERE segments.date BETWEEN '2024-09-01' AND '2024-09-02'
    `;

    const authToken: string = await this.refreshAccessToken()
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
          'login-customer-id': process.env.GOOGLE_CHANNEL_TEMP_CUSTOMER_ID,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ query })
      });
  
      if (!response.ok) {
        const error = await response.json();
        console.error('Error:', error);
        throw new Error(`Request failed: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Google Ads Data:', data);
      return data;
    } catch (error) {
      console.error('Fetch Error:', error);
      throw error;
    }
  };
  
  async getChannelData(integration: Integration, initial: boolean): Promise<AError | undefined> {
    const dbAccounts = await this.saveAdAccounts(integration);
    if (isAError(dbAccounts)) return dbAccounts;
    if (!integration.refreshToken) return new AError('Refresh token is required');

    try {

    const customers = await this.fetchGoogleAdsData()

    customers[0].results.map(async (customer) => {
      let youtubeData = await this.fetchYoutubeAds(customer.customerClient.clientCustomer.split('/')[1])
      console.log(youtubeData, 'YOUTUBE DATAAATA')
    })

    } catch (err) {
      logger.error(err, 'GET CHANNEL DATA');
    }

    // for (const dbAccount of dbAccounts) {
    //   const ranges = await timeRanges(initial, dbAccount.id);
    //   for (const range of ranges) {
    //     const analytics = await this.getAdAnalytics(integration, range, dbAccount);
    //     if (isAError(analytics)) return analytics;

    //     const campaigns = await this.getCampaignGroupsAsCampaigns(integration, analytics.campaignGroupIds, dbAccount);
    //     if (isAError(campaigns)) return campaigns;

    //     const adSets = await this.getCampaignsAsAdSets(
    //       integration,
    //       new Set(Array.from(analytics.campaignIds).map((c) => c.externalCampaignId)),
    //       dbAccount,
    //     );
    //     if (isAError(adSets)) return adSets;
    //     const ads: ChannelAd[] = Array.from(analytics.creativeIds).map((c) => ({
    //       externalAdAccountId: dbAccount.externalId,
    //       externalId: c.externalCreativeId,
    //       externalAdSetId: c.externalCampaignId,
    //     }));
    //     await deleteOldInsights(dbAccount.id, range.since, range.until);
    //     await saveInsightsAdsAdsSetsCampaigns(
    //       campaigns,
    //       new Map<string, string>(),
    //       dbAccount,
    //       adSets,
    //       new Map<string, string>(),
    //       ads,
    //       new Map<string, string>(),
    //       [],
    //       new Map<string, string>(),
    //       analytics.insights,
    //     );
    //   }
    // }
    return Promise.resolve(undefined);
  }

  async getAdPreview(
    integration: Integration,
    adId: string,
    publisher?: PublisherEnum,
    device?: DeviceEnum,
    position?: string,
  ): Promise<ChannelIFrame | AError> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    if (!isMetaAdPosition(position)) return new AError('Invalid position');
    const { externalId } = await prisma.ad.findUniqueOrThrow({ where: { id: adId } });
    const ad = new Ad(externalId, {}, undefined, undefined);
    const format = getIFrameAdFormat(publisher, device, position);
    if (!format) {
      logger.error('Invalid ad format %o', { publisher, device, position, adId });
      return new AError('Invalid ad format');
    }
    const previewsFn = ad.getPreviews([AdPreview.Fields.body], {
      ad_format: format,
    });
    const previewSchema = z.object({ body: z.string() });
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- to complicated
    const toBody = (preview: z.infer<typeof previewSchema>) => preview.body;
    const parsedPreviews = await Google.handlePagination(integration, previewsFn, previewSchema, toBody);
    if (isAError(parsedPreviews)) return parsedPreviews;

    if (parsedPreviews.length === 0) return new AError('No ad preview found');
    if (parsedPreviews.length > 1) return new AError('More than one ad previews found');
    const iFrame = getIFrame(parsedPreviews[0]);
    if (isAError(iFrame)) return iFrame;

    const overrideDimensions = formatDimensionsMap.get(format);
    if (overrideDimensions) {
      iFrame.width = overrideDimensions.width;
      iFrame.height = overrideDimensions.height;
    }

    return iFrame;
  }

  getDefaultPublisher(): PublisherEnum {
    return PublisherEnum.Facebook;
  }

  async saveAdAccounts(integration: Integration): Promise<DbAdAccount[] | AError> {
    try {
      if (!integration.refreshToken) return new AError('No refresh token found');

      const customer = adsAPi.Customer({
        customer_id: process.env.GOOGLE_CHANNEL_TEMP_CUSTOMER_ID || '',
        refresh_token: integration.refreshToken,
      });
      const query = `
      SELECT 
        customer.resource_name, 
        customer.id, 
        customer.currency_code, 
        customer.descriptive_name 
      FROM 
        customer
      LIMIT 50
      `;

      const youtubeResponse = await customer.query(query);

      const response = await customer.query(query);


      const accountSchema = z.array(
        z.object({
          customer: z.object({
            resource_name: z.string(),
            id: z.string().or(z.number()),
            currency_code: z.string(),
            descriptive_name: z.string().optional(),
          }),
        }),
      );

      const parsed = accountSchema.safeParse(response);

      if (!parsed.success) {
        return new AError('Failed to parse Google Ads accounts data');
      }

      const channelAccounts = parsed.data.map((account) => ({
        name: account.customer.descriptive_name ?? account.customer.resource_name,
        currency: account.customer.currency_code,
        externalId: account.customer.id.toString(),
      })) satisfies ChannelAdAccount[];

      return await saveAccounts(channelAccounts, integration);
    } catch (err) {
      console.log(err, 'THIS IS ERRORRR OF GOOGLE API CALL');
      logger.error(err);
    }
  }

  private async getCreatives(
    accounts: ChannelAdAccount[],
    integration: Integration,
  ): Promise<ChannelCreative[] | AError> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const creatives: ChannelCreative[] = [];
    const adsSchema = z.object({
      id: z.string(),
      account_id: z.string(),
      creative: z.object({ id: z.string(), name: z.string() }),
    });
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- to complicated
    const toCreative = (ad: z.infer<typeof adsSchema>) => ({
      externalAdId: ad.id,
      externalId: ad.creative.id,
      name: ad.creative.name,
      externalAdAccountId: ad.account_id,
    });

    for (const acc of accounts) {
      const account = new AdAccount(`act_${acc.externalId}`, {}, undefined, undefined);
      const getAdsFn = account.getAds(
        [Ad.Fields.id, Ad.Fields.account_id, `creative{${AdCreative.Fields.id}, ${AdCreative.Fields.name}}`],
        {
          limit,
        },
      );
      const accountCreatives = await Google.handlePagination(integration, getAdsFn, adsSchema, toCreative);
      if (!isAError(accountCreatives)) creatives.push(...accountCreatives);
    }
    return creatives;
  }

  async getReportStatus({ id, integration }: AdAccountWithIntegration, taskId: string): Promise<JobStatusEnum> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const reportId = taskId;
    const report = new AdReportRun(reportId, { report_run_id: reportId }, undefined, undefined);
    const resp = await Google.sdk(
      () => report.get([AdReportRun.Fields.async_status, AdReportRun.Fields.async_percent_completion]),
      integration,
    );
    const googleJobStatusEnum = z.enum([
      'Job Not Started',
      'Job Started',
      'Job Running',
      'Job Completed',
      'Job Failed',
      'Job Skipped',
    ]);
    const reportSchema = z.object({
      [AdReportRun.Fields.async_status]: googleJobStatusEnum,
      [AdReportRun.Fields.async_percent_completion]: z.number(),
    });
    const parsed = reportSchema.safeParse(resp);
    if (!parsed.success) {
      logger.error(parsed.error, `Failed to parse google ad report for ${reportId} and ${id}`);
      return JobStatusEnum.FAILED;
    }
    const goolgleJobStatusMap = new Map<z.infer<typeof googleJobStatusEnum>, JobStatusEnum>([
      ['Job Not Started', JobStatusEnum.QUEUING],
      ['Job Started', JobStatusEnum.PROCESSING],
      ['Job Running', JobStatusEnum.PROCESSING],
      ['Job Completed', JobStatusEnum.SUCCESS],
      ['Job Failed', JobStatusEnum.FAILED],
      ['Job Skipped', JobStatusEnum.CANCELED],
    ]);
    return goolgleJobStatusMap.get(parsed.data.async_status) ?? JobStatusEnum.FAILED;
  }

  async saveCreatives(integration: Integration, groupByAdAccount: Map<string, AdWithAdAccount[]>): Promise<void> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const creativeExternalIdMap = new Map<string, string>();
    for (const [__, accountAds] of groupByAdAccount) {
      const adExternalIdMap = new Map(accountAds.map((ad) => [ad.externalId, ad.id]));
      const adAccount = accountAds[0].adAccount;
      const chunkedAccountAds = _.chunk(accountAds, 100);
      for (const chunk of chunkedAccountAds) {
        const creatives = await this.getCreatives(
          integration,
          adAccount.id,
          // adAccount.externalId,
          // new Set(chunk.map((a) => a.externalId)),
        );
        const newCreatives = creatives.filter((c) => !creativeExternalIdMap.has(c.externalId));
        await saveCreatives(newCreatives, adAccount.id, adExternalIdMap, creativeExternalIdMap);
      }
    }
  }

  async processReport(
    adAccount: AdAccountWithIntegration,
    taskId: string,
    since: Date,
    until: Date,
  ): Promise<AError | undefined> {
    adsSdk.FacebookAdsApi.init(adAccount.integration.accessToken);
    const reportId = taskId;
    const adExternalIdMap = new Map<string, string>();
    const externalAdSetToIdMap = new Map<string, string>();
    const externalCampaignToIdMap = new Map<string, string>();
    const insightSchema = z.object({
      account_id: z.string(),
      adset_id: z.string(),
      adset_name: z.string(),
      ad_id: z.string(),
      ad_name: z.string(),
      campaign_id: z.string(),
      campaign_name: z.string(),
      date_start: z.coerce.date(),
      impressions: z.coerce.number(),
      spend: z.coerce.number(),
      device_platform: z.string(),
      publisher_platform: z.string(),
      platform_position: z.string(),
      inline_link_clicks: z.coerce.number().optional(),
    });

    const toInsightAndAd = (
      insight: z.infer<typeof insightSchema>,
    ): { insight: ChannelInsight; ad: ChannelAd; adSet: ChannelAdSet; campaign: ChannelCampaign } => ({
      insight: {
        clicks: insight.inline_link_clicks ?? 0,
        externalAdId: insight.ad_id,
        date: insight.date_start,
        externalAccountId: insight.account_id,
        impressions: insight.impressions,
        spend: Math.trunc(insight.spend * 100), // converting to cents
        device: Google.deviceEnumMap.get(insight.device_platform) ?? DeviceEnum.Unknown,
        publisher: Google.publisherEnumMap.get(insight.publisher_platform) ?? PublisherEnum.Unknown,
        position: insight.platform_position,
      },
      ad: {
        externalAdSetId: insight.adset_id,
        externalAdAccountId: insight.account_id,
        externalId: insight.ad_id,
        name: insight.ad_name,
      },
      campaign: {
        externalAdAccountId: insight.account_id,
        externalId: insight.campaign_id,
        name: insight.campaign_name,
      },
      adSet: {
        externalCampaignId: insight.campaign_id,
        externalId: insight.adset_id,
        name: insight.adset_name,
      },
    });

    logger.info('Getting insights for report %s', reportId);

    const report = new AdReportRun(reportId, { report_run_id: reportId }, undefined, undefined);
    const getInsightsFn = report.getInsights(
      [
        ...this.insightFields,
        AdsInsights.Breakdowns.device_platform,
        AdsInsights.Breakdowns.publisher_platform,
        AdsInsights.Breakdowns.platform_position,
      ],
      {
        limit,
      },
    );
    const insightsProcessFn = async (
      i: {
        insight: ChannelInsight;
        ad: ChannelAd;
        adSet: ChannelAdSet;
        campaign: ChannelCampaign;
      }[],
    ): Promise<undefined> => {
      await this.saveAdsAdSetsCampaignsAndInsights(
        i,
        adExternalIdMap,
        externalAdSetToIdMap,
        externalCampaignToIdMap,
        adAccount,
      );
      return undefined;
    };
    await deleteOldInsights(adAccount.id, since, until);
    const accountInsightsAndAds = await Google.handlePaginationFn(
      adAccount.integration,
      getInsightsFn,
      insightSchema,
      toInsightAndAd,
      insightsProcessFn,
    );
    if (isAError(accountInsightsAndAds)) return accountInsightsAndAds;
  }

  async runAdInsightReport(
    adAccount: DbAdAccount,
    integration: Integration,
    since: Date,
    until: Date,
  ): Promise<string | AError> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const adReportRunSchema = z.object({ id: z.string() });
    const account = new AdAccount(`act_${adAccount.externalId}`, {}, undefined, undefined);
    const resp = await Google.sdk(async () => {
      const mtimeRange = { since: formatYYYMMDDDate(since), until: formatYYYMMDDDate(until) };
      logger.info(`Running report for account ${adAccount.id} with time range ${JSON.stringify(mtimeRange)}`);

      return account.getInsightsAsync(this.insightFields, {
        limit,
        time_increment: 1,
        filtering: [{ field: AdsInsights.Fields.spend, operator: 'GREATER_THAN', value: '0' }],
        breakdowns: [
          AdsInsights.Breakdowns.device_platform,
          AdsInsights.Breakdowns.publisher_platform,
          AdsInsights.Breakdowns.platform_position,
        ],
        level: AdsInsights.Level.ad,
        time_range: mtimeRange,
      });
    }, integration);
    if (isAError(resp)) {
      logger.error(resp, 'Failed to run ad report');
      return resp;
    }
    const parsed = adReportRunSchema.safeParse(resp);
    if (!parsed.success) {
      logger.error('Failed to parse ad report run %o', resp);
      return new AError('Failed to parse google ad report run');
    }
    return parsed.data.id;
  }

  async saveOldInsightsAdsAdsSetsCampaigns(
    integration: Integration,
    groupByAdAccount: Map<string, AdWithAdAccount[]>,
  ): Promise<undefined | AError> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    for (const [_, accountAds] of groupByAdAccount) {
      const adAccount = accountAds[0].adAccount;

      const schema = z.object({
        id: z.string(),
        campaign_id: z.string(),
        campaign: z.object({ name: z.string() }),
        adset_id: z.string(),
        adset: z.object({ name: z.string() }),
      });
      const toAdSetAdAndCampaign = (
        ad: z.infer<typeof schema>,
      ): {
        adId: string;
        adSetId: string;
        campaignId: string;
        campaignName: string;
        adSetName: string;
      } => ({
        adId: ad.id,
        adSetId: ad.adset_id,
        campaignId: ad.campaign_id,
        campaignName: ad.campaign.name,
        adSetName: ad.adset.name,
      });

      const processFn = async (
        adSetAdAndCampaigns: {
          adId: string;
          adSetId: string;
          campaignId: string;
          campaignName: string;
          adSetName: string;
        }[],
      ): Promise<undefined> => {
        const { campaigns, adSets, ads } = adSetAdAndCampaigns.reduce<{
          ads: ChannelAd[];
          adSets: ChannelAdSet[];
          campaigns: ChannelCampaign[];
        }>(
          (acc, row) => {
            acc.ads.push({
              externalAdSetId: String(row.adSetId),
              externalAdAccountId: adAccount.externalId,
              externalId: row.adId,
              name: row.adSetName,
            });
            acc.adSets.push({
              externalCampaignId: row.campaignId,
              externalId: row.adSetId,
              name: row.campaignName,
            });
            acc.campaigns.push({
              externalAdAccountId: adAccount.externalId,
              externalId: row.campaignId,
              name: row.campaignName,
            });
            return acc;
          },
          { ads: [], adSets: [], campaigns: [] },
        );
        await saveInsightsAdsAdsSetsCampaigns(campaigns, new Map(), adAccount, adSets, new Map(), ads, new Map(), []);
      };

      let start = 0;
      let smallAccountAds = accountAds.slice(start, start + limit);
      while (smallAccountAds.length > 0) {
        const account = new AdAccount(`act_${adAccount.externalId}`, {}, undefined, undefined);
        const callFn = account.getAds(
          [
            Ad.Fields.id,
            Ad.Fields.campaign_id,
            `${Ad.Fields.campaign}{name}`,
            Ad.Fields.adset_id,
            `${Ad.Fields.adset}{name}`,
          ],
          {
            limit,
            effective_status: [
              'ACTIVE',
              'PAUSED',
              'DISAPPROVED',
              'PENDING_REVIEW',
              'CAMPAIGN_PAUSED',
              'ARCHIVED',
              'ADSET_PAUSED',
              'IN_PROCESS',
              'WITH_ISSUES',
            ],
            filtering: [{ field: Ad.Fields.id, operator: 'IN', value: smallAccountAds.map((a) => a.externalId) }],
          },
        );
        await Google.handlePaginationFn(integration, callFn, schema, toAdSetAdAndCampaign, processFn);
        start += limit;
        smallAccountAds = accountAds.slice(start, start + limit);
      }
    }
    return Promise.resolve(undefined);
  }

  private async saveAdsAdSetsCampaignsAndInsights(
    accountInsightsAndAds: { insight: ChannelInsight; ad: ChannelAd; adSet: ChannelAdSet; campaign: ChannelCampaign }[],
    adExternalIdMap: Map<string, string>,
    externalAdSetToIdMap: Map<string, string>,
    externalCampaignToIdMap: Map<string, string>,
    dbAccount: AdAccountWithIntegration,
  ): Promise<void> {
    const [insights, ads, adSets, campaigns] = accountInsightsAndAds.reduce(
      (acc, item) => {
        acc[0].push(item.insight);
        acc[1].push(item.ad);
        acc[2].push(item.adSet);
        acc[3].push(item.campaign);
        return acc;
      },
      [[] as ChannelInsight[], [] as ChannelAd[], [] as ChannelAdSet[], [] as ChannelCampaign[]],
    );
    await saveInsightsAdsAdsSetsCampaigns(
      campaigns,
      externalCampaignToIdMap,
      dbAccount,
      adSets,
      externalAdSetToIdMap,
      ads,
      adExternalIdMap,
      insights,
    );
  }

  private static async handlePagination<T, U extends ZodTypeAny>(
    integration: Integration,
    fn: Promise<Cursor | AError> | Cursor | AError,
    schema: U,
    parseCallback: (result: z.infer<U>) => T,
  ): Promise<AError | T[]> {
    const cursor = await this.sdk(() => fn, integration);
    if (isAError(cursor)) return cursor;
    const arraySchema = z.array(schema);
    const parsed = arraySchema.safeParse(cursor);
    if (!parsed.success) {
      logger.error('Failed to parse %o', cursor);
      return new AError('Failed to parse google paginated response');
    }
    const results = parsed.data.map(parseCallback);
    while (cursor.hasNext()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Will catch error
      const next = await this.sdk<T>(() => cursor.next(), integration);
      const parsedNext = arraySchema.safeParse(next);
      if (parsedNext.success) {
        results.push(...parsedNext.data.map(parseCallback));
      } else {
        logger.error(parsedNext, 'Failed to parse paginated');
      }
    }
    return results;
  }

  private static async handlePaginationFn<T, U extends ZodTypeAny, V>(
    integration: Integration,
    fn: Promise<Cursor> | Cursor,
    schema: U,
    parseCallback: (result: z.infer<U>) => T,
    processCallback: (result: T[]) => Promise<V[] | undefined> | V[] | undefined,
  ): Promise<AError | V[] | undefined> {
    const cursor = await this.sdk(() => fn, integration);
    if (isAError(cursor)) return cursor;
    const arraySchema = z.array(schema);
    const parsed = arraySchema.safeParse(cursor);
    if (!parsed.success) {
      logger.error('Failed to parse %o', cursor);
      return new AError('Failed to parse google paginated response');
    }
    const resultsP = processCallback(parsed.data.map(parseCallback));
    while (cursor.hasNext()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Will catch error
      const next = await this.sdk<T>(() => cursor.next(), integration);
      const parsedNext = arraySchema.safeParse(next);
      if (parsedNext.success) {
        const processed = await processCallback(parsedNext.data.map(parseCallback));
        const results = await resultsP;
        if (results && processed) results.push(...processed);
      } else {
        logger.error(parsedNext, 'Failed to parse paginated function');
      }
    }
    return resultsP;
  }

  private static async sdk<T>(fn: () => Promise<T> | T | AError, integration: Integration): Promise<T | AError> {
    try {
      return await retry(async () => await fn());
    } catch (error) {
      const msg = 'Failed to complete fb sdk call';
      logger.error(error, msg);
      if (error instanceof Error) {
        await disConnectIntegrationOnError(integration.id, error, true);
      }
      return new AError(msg);
    }
  }

  private static parseRequest(signedRequest: string, secret: string): string | AError {
    const [encodedSig, payload] = signedRequest.split('.');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    const signOutTokenSchema = z.object({
      user_id: z.string(),
      algorithm: z.literal('HMAC-SHA256'),
      issued_at: z.number(),
    });
    const parsed = signOutTokenSchema.safeParse(data);
    if (!parsed.success) {
      return new AError('Failed to parse sign out token');
    }
    if (parsed.data.algorithm.toUpperCase() !== 'HMAC-SHA256')
      return new AError('Failed to verify sign out token, wrong algorithm');

    const hmac = createHmac('sha256', secret);
    const encodedPayload = hmac
      .update(payload)
      .digest('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/={1,2}$/, '');

    if (encodedSig !== encodedPayload) return new AError('Failed to verify sign out token');

    return parsed.data.user_id;
  }

  private static async getExpireAt(accessToken: string): Promise<AError | Date> {
    const debugToken = await fetch(
      `${baseGraphFbUrl}/debug_token?input_token=${accessToken}&access_token=${env.GOOGLE_CHANNEL_APPLICATION_ID}|${env.GOOGLE_CHANNEL_APPLICATION_SECRET}`,
    ).catch((error: unknown) => {
      logger.error('Failed to debug token %o', { error });
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    });
    if (debugToken instanceof Error) return debugToken;
    if (!debugToken.ok) {
      logger.error(await debugToken.json(), `Failed to debug token for accessToken: ${accessToken}`);
      return new AError(`Failed to debug token: ${debugToken.statusText}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const debugTokenBody = await debugToken.json().catch((_e: unknown) => null);
    const debugTokenParsed = z
      .object({ data: z.object({ data_access_expires_at: z.number() }) })
      .safeParse(debugTokenBody);
    if (!debugTokenParsed.success) {
      return new AError('Failed to parse token response');
    }
    return new Date(debugTokenParsed.data.data.data_access_expires_at * 1000);
  }

  private static deviceEnumMap: Map<string, DeviceEnum> = new Map<string, DeviceEnum>([
    ['mobile_app', DeviceEnum.MobileApp],
    ['mobile_web', DeviceEnum.MobileWeb],
    ['desktop', DeviceEnum.Desktop],
  ]);

  private static publisherEnumMap: Map<string, PublisherEnum> = new Map<string, PublisherEnum>([
    ['facebook', PublisherEnum.Facebook],
    ['instagram', PublisherEnum.Instagram],
    ['messenger', PublisherEnum.Messenger],
    ['audience_network', PublisherEnum.AudienceNetwork],
  ]);

  getType(): IntegrationTypeEnum {
    return IntegrationTypeEnum.GOOGLE;
  }
}

const disConnectIntegrationOnError = async (integrationId: string, error: Error, notify: boolean): Promise<boolean> => {
  const metaErrorValidatingAccessTokenChangedSession =
    'Error validating access token: The session has been invalidated because the user changed their password or Facebook has changed the session for security reasons.';
  const metaErrorNotAuthenticated = 'Error validating access token: The user has not authorized application';
  const metaErrorFollowInstructions =
    'You cannot access the app till you log in to www.facebook.com and follow the instructions given.';
  if (
    error.message === metaErrorValidatingAccessTokenChangedSession ||
    error.message === metaErrorFollowInstructions ||
    error.message.startsWith(metaErrorNotAuthenticated)
  ) {
    await markErrorIntegrationById(integrationId, notify);
    return true;
  }
  return false;
};

export const google = new Google();
