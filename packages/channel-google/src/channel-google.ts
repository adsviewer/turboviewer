import { URLSearchParams } from 'node:url';
import { OAuth2Client } from 'google-auth-library';
import {
  CurrencyEnum,
  type AdAccount as DbAdAccount,
  DeviceEnum,
  type Integration,
  IntegrationTypeEnum,
  prisma,
  PublisherEnum,
  IntegrationStatus,
} from '@repo/database';
import { addInterval, AError, FireAndForget, formatYYYMMDDDate, isAError } from '@repo/utils';
import { z, type ZodSchema, type ZodTypeAny } from 'zod';
import { logger } from '@repo/logger';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import {
  type AdAccountIntegration,
  authEndpoint,
  type ChannelAd,
  type ChannelCampaign,
  type ChannelCreative,
  type ChannelIFrame,
  type ChannelInsight,
  type ChannelInterface,
  deleteOldInsights,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  getIFrame,
  type JobStatusEnum,
  markStatusIntegrationById,
  parseRequest,
  revokeIntegration,
  saveAccounts,
  saveInsightsAdsAdsSetsCampaigns,
  timeRanges,
  type TokensResponse,
  updateIntegrationTokens,
} from '@repo/channel-utils';
import { env } from './config';
import {
  assetResponseSchema,
  customerQueryResponseSchema,
  defaultQueryResponseSchema,
  type GroupedAdData,
  responseSchema,
  videoAdResponseSchema,
} from './schema';

const fireAndForget = new FireAndForget();

const apiVersion = 'v18';
const baseUrl = `https://googleads.googleapis.com/${apiVersion}`;

interface GenericResponse<T> {
  requestId?: string;
  queryResourceConsumption?: string;
  results?: T[];
  fieldMask?: string;
  nextPageToken?: string;
}

const client = new OAuth2Client(
  env.GOOGLE_CHANNEL_APPLICATION_ID,
  env.GOOGLE_CHANNEL_APPLICATION_SECRET,
  `${env.API_ENDPOINT}${authEndpoint}`,
);

const tokenHasBeenExpiredOrRevoked = 'Token has been expired or revoked.';

class Google implements ChannelInterface {
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
    const {
      refresh_token: refreshToken,
      id_token: idToken,
      access_token: accessToken,
      expiry_date: expiryDate,
    } = getTokenResponse.tokens;
    if (!idToken || !accessToken || !refreshToken || !expiryDate) {
      return new AError(`Failed to get tokens`);
    }
    return {
      accessToken,
      accessTokenExpiresAt: new Date(expiryDate),
      refreshToken,
    };
  }

  async getUserId(accessToken: string): Promise<string | AError> {
    const url = `${baseUrl}/customers:listAccessibleCustomers`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
      },
    });

    const customers: unknown = await response.json();

    const parsed = z.object({ resourceNames: z.array(z.string()) }).safeParse(customers);
    if (!parsed.success) {
      logger.error(parsed.error, 'Failed to parse Google user response');
      return new AError('Failed to fetch user');
    }

    if (parsed.data.resourceNames.length === 1) return parsed.data.resourceNames[0].split('/')[1];

    const rightManagerId = await Google.findManagerAccount(accessToken, parsed.data.resourceNames);

    return rightManagerId;
  }

  signOutCallback(req: ExpressRequest, res: ExpressResponse): void {
    logger.info(`sign out callback body ${JSON.stringify(req.body)}`);

    const parsedBody = z.object({ signed_request: z.string() }).safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).send('Failed to parse sign out request');
      return;
    }
    const userId = parseRequest(parsedBody.data.signed_request, env.GOOGLE_CHANNEL_APPLICATION_SECRET);
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

    const refreshedIntegration = await Google.refreshedIntegration(integration);
    if (isAError(refreshedIntegration)) {
      if (refreshedIntegration.message === tokenHasBeenExpiredOrRevoked) return integration.externalId;
      return refreshedIntegration;
    }

    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${refreshedIntegration.accessToken}`;

    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).catch((error: unknown) => {
      logger.error({ error }, 'Failed to de-authorize %o');
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    });

    if (response instanceof Error) return response;
    if (!response.ok) {
      const error = new Error('De-authorization request failed');
      logger.error({ response }, 'De-authorization request failed');
      if (await disConnectIntegrationOnError(integration.id, error)) {
        return integration.externalId;
      }
      return error;
    }

    return integration.externalId;
  }

  async refreshAccessToken(integration: Integration): Promise<Integration | AError> {
    if (!integration.refreshToken) return new AError('No refresh token found');
    const url = `https://www.googleapis.com/oauth2/v3/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', env.GOOGLE_CHANNEL_APPLICATION_ID);
    params.append('client_secret', env.GOOGLE_CHANNEL_APPLICATION_SECRET);
    params.append('refresh_token', integration.refreshToken);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }).catch(() => {
      return new AError(`Failed to refresh token`);
    });

    if (isAError(response)) {
      return response;
    }

    const tokenData: unknown = await response.json();

    const errorSchema = z.object({ error: z.string(), error_description: z.string() });
    const schema = z.object({
      access_token: z.string(),
      expires_in: z.number().int(),
      scope: z.string(),
    });

    const errorParsed = errorSchema.safeParse(tokenData);
    if (errorParsed.success) {
      if (errorParsed.data.error_description === tokenHasBeenExpiredOrRevoked) {
        await markStatusIntegrationById(integration.id, IntegrationStatus.REVOKED);
      }
      return new AError(`Failed to refresh token: ${errorParsed.data.error_description}`);
    }

    const parsed = schema.safeParse(tokenData);
    if (!parsed.success) {
      logger.error(parsed.error, 'Failed to parse refresh access token response');
      return new AError('Failed to parse refresh access token response');
    }

    return await updateIntegrationTokens(integration, {
      accessToken: parsed.data.access_token,
      accessTokenExpiresAt: addInterval(new Date(), 'seconds', parsed.data.expires_in),
      refreshToken: integration.refreshToken,
    });
  }

  private static async refreshedIntegration(integration: Integration): Promise<Integration | AError> {
    const expiresAt = integration.accessTokenExpiresAt;

    const fiveMinsFromNow = addInterval(new Date(), 'seconds', 60 * 5);

    if (expiresAt && expiresAt.getTime() < fiveMinsFromNow.getTime()) {
      return await google.refreshAccessToken(integration);
    }

    return integration;
  }

  async getAdAccountData(
    integration: Integration,
    dbAccount: DbAdAccount,
    initial: boolean,
  ): Promise<AError | undefined> {
    const ranges = await timeRanges(initial, dbAccount.id);

    for (const range of ranges) {
      try {
        const videoQuery = `
      SELECT 
      video.id,
      video.title,
      video.duration_millis,
      
      ad_group_ad.status,
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.ad.video_responsive_ad.call_to_actions,
      ad_group_ad.ad.video_responsive_ad.videos,
      ad_group_ad.ad.video_responsive_ad.descriptions,
      
      ad_group.id,
      ad_group.name,
      
      campaign.id,
      campaign.name,
      
      segments.device,
      segments.date,

      metrics.clicks,
      metrics.impressions,
      metrics.cost_micros 
  FROM video
      WHERE segments.date BETWEEN '${formatYYYMMDDDate(range.since)}' AND '${formatYYYMMDDDate(range.until)}'
    `;

        const youtubeData = await Google.handlePagination(
          integration,
          videoQuery,
          videoAdResponseSchema,
          dbAccount.externalId,
        );

        if (!youtubeData || isAError(youtubeData)) return;

        const groupedData = youtubeData.reduce<GroupedAdData>((acc, item) => {
          const date = item.segments.date;
          const adId = item.adGroupAd.ad.id;
          const device = item.segments.device;

          if (adId === '__proto__' || adId === 'constructor' || adId === 'prototype') {
            return acc;
          }

          acc[date] = acc[date] ?? {};

          acc[date][adId] = acc[date][adId] ?? {};

          acc[date][adId][device] = acc[date][adId][device] ?? {
            date,
            adId,
            campaign: {
              name: '',
              id: '',
            },
            metrics: {
              clicks: 0,
              costMicros: 0,
              impressions: 0,
            },
            videos: new Set(),
            device,
            adGroup: item.adGroup,
            adGroupAd: item.adGroupAd,
          };

          const adData = acc[date][adId][device];

          adData.metrics.clicks += parseInt(item.metrics.clicks, 10);
          adData.metrics.costMicros += parseInt(item.metrics.costMicros, 10);
          adData.metrics.impressions += parseInt(item.metrics.impressions, 10);
          adData.adGroup = item.adGroup;
          adData.adGroupAd = item.adGroupAd;
          adData.campaign = item.campaign;

          if (item.adGroupAd.ad.videoResponsiveAd) {
            item.adGroupAd.ad.videoResponsiveAd.videos.forEach((video) => adData.videos.add(video.asset));
          }

          adData.date = item.segments.date;

          return acc;
        }, {});

        const result = Object.values(groupedData).flatMap((dateGroup) =>
          Object.values(dateGroup).flatMap((deviceGroup) =>
            Object.values(deviceGroup).map((ad) => ({
              ...ad,
            })),
          ),
        );

        const campaignGroup: ChannelCampaign[] = result.map((el) => ({
          externalId: String(el.campaign.id),
          name: el.campaign.name.toString(),
          externalAdAccountId: dbAccount.externalId,
        }));

        const adSets = result.map((el) => ({
          externalId: String(el.adGroup.id),
          name: el.adGroup.name,
          externalCampaignId: el.campaign.id,
        }));

        const ads: ChannelAd[] = youtubeData.map((c) => ({
          externalAdAccountId: dbAccount.externalId,
          externalId: c.adGroupAd.ad.id,
          externalAdSetId: String(c.adGroup.id),
          name: c.video.title,
        }));

        const creatives: ChannelCreative[] = [];

        const uniqueExternalIds = [...new Set(youtubeData.map((c) => c.adGroupAd.ad.id))];

        const adsWithoutCreatives = await prisma.ad.findMany({
          where: {
            externalId: { in: uniqueExternalIds },
            creativeId: null,
          },
          select: {
            externalId: true,
          },
        });

        for (const externalId of adsWithoutCreatives) {
          const el = youtubeData.find((c) => c.adGroupAd.ad.id === externalId.externalId);

          if (!el) continue;

          if (el.adGroupAd.ad.videoResponsiveAd !== undefined) {
            const query = `
                  SELECT
                  asset.id,
                  asset.resource_name,
                  asset.youtube_video_asset.youtube_video_id
                FROM
                  asset
                WHERE
                  asset.resource_name IN (${el.adGroupAd.ad.videoResponsiveAd.videos.map((c) => `'${c.asset}'`).join(',')})
              `;

            const asset = await Google.handlePagination(integration, query, assetResponseSchema, dbAccount.externalId);

            if (!asset || isAError(asset)) return;

            const flattenedCreatives: ChannelCreative[] = asset.map((c) => ({
              externalAdId: el.adGroupAd.ad.id,
              externalId: c.asset.id,
              adAccountId: dbAccount.id,
              name: c.asset.resourceName,
              body: el.adGroupAd.ad.videoResponsiveAd?.descriptions?.[0].text,
              status: el.adGroupAd.status,
              title: el.video.title,
              callToActionType: el.adGroupAd.ad.videoResponsiveAd?.callToActions?.[0].text,
              imageUrl: `https://youtube.com/watch?v=${c.asset.youtubeVideoAsset?.youtubeVideoId ?? ''}`,
            }));

            creatives.push(...flattenedCreatives);
          }
        }

        const insights: ChannelInsight[] = result.map((el) => ({
          clicks: Number(el.metrics.clicks),
          impressions: Number(el.metrics.impressions),
          spend: Number(el.metrics.costMicros) / 1000,
          externalAdId: el.adId,
          date: new Date(el.date),
          externalAccountId: dbAccount.externalId,
          device: el.device.length ? (Google.deviceEnumMap.get(el.device) ?? DeviceEnum.Unknown) : DeviceEnum.Unknown,
          publisher: PublisherEnum.Google,
          position: el.adGroupAd.ad.type ?? 'feed',
        }));

        const uniqueInsights = Array.from(
          new Map(
            insights.map((insight) => [
              `${insight.externalAdId}-${insight.date.toISOString()}-${insight.device}-${insight.publisher}-${insight.position}`,
              insight,
            ]),
          ).values(),
        );

        await deleteOldInsights(dbAccount.id, range.since, range.until);
        await saveInsightsAdsAdsSetsCampaigns(
          campaignGroup,
          new Map<string, string>(),
          dbAccount,
          adSets,
          new Map<string, string>(),
          ads,
          new Map<string, string>(),
          creatives,
          uniqueInsights,
        );

        logger.info(
          `Finished ${range.since.toISOString()} - ${range.until.toISOString()} ad ingress for adAccountId: ${dbAccount.id}`,
        );
      } catch (err) {
        logger.error(err, 'GET CHANNEL DATA');
      }
    }

    return Promise.resolve(undefined);
  }

  async getAdPreview(
    integration: Integration,
    adId: string,
    _publisher?: PublisherEnum,
    _device?: DeviceEnum,
    _position?: string,
  ): Promise<ChannelIFrame | AError> {
    const { externalId, adAccount } = await prisma.ad.findUniqueOrThrow({
      include: { adAccount: true },
      where: { id: adId },
    });

    try {
      const query = `
        SELECT video.id, ad_group_ad.ad.id, ad_group_ad.ad.name FROM video WHERE ad_group_ad.ad.id = ${externalId}
      `;
      const response = await Google.handlePagination(integration, query, responseSchema, adAccount.externalId);

      if (isAError(response)) return new AError('Error while fetching google ad');

      if (!response?.length) return new AError('No data found');

      const adData = response[0];

      const previewHTML = `
      <iframe
        title="${adData.adGroupAd.ad.name ?? ''}"
        src="https://youtube.com/embed/${adData.video.id}"
        width="600"
        height="400"
        scrolling="no"
      ></iframe>
      `;

      return getIFrame(previewHTML);
    } catch (error) {
      return new AError(`Something went wrong while getting the preview`);
    }
  }

  getDefaultPublisher(): PublisherEnum {
    return PublisherEnum.Facebook;
  }

  async saveAdAccounts(integration: Integration): Promise<DbAdAccount[] | AError> {
    const customerQuery = `
    SELECT
      customer_client.client_customer,
      customer_client.descriptive_name
    FROM
      customer_client
    WHERE customer_client.status = 'ENABLED'
  `;

    const response = await Google.handlePagination(integration, customerQuery, defaultQueryResponseSchema);

    if (isAError(response)) return new AError('Error fetching google customers');

    if (!response) return new AError('No data found');

    const updatedCustomers = [];

    for (const customer of response) {
      const currencyCodeQuery = `
          SELECT
            customer.id,
            customer.currency_code
          FROM
            customer
        `;

      const currencyCode = await Google.handlePagination(
        integration,
        currencyCodeQuery,
        customerQueryResponseSchema,
        customer.customerClient.clientCustomer.split('/')[1],
      );

      if (isAError(currencyCode)) return new AError('Error fetching currency code');

      if (!currencyCode) return new AError('No currency code found');

      const updatedCustomerClient = {
        resourceName: customer.customerClient.resourceName,
        currencyCode: currencyCode[0].customer.currencyCode || CurrencyEnum.USD,
        id: customer.customerClient.clientCustomer.split('/')[1],
        descriptiveName: customer.customerClient.descriptiveName,
      };

      updatedCustomers.push(updatedCustomerClient);
    }

    const accountSchema = z.array(
      z.object({
        resourceName: z.string(),
        id: z.string().or(z.number()),
        currencyCode: z.nativeEnum(CurrencyEnum),
        descriptiveName: z.string().optional(),
      }),
    );

    const parsed = accountSchema.safeParse(updatedCustomers);

    if (!parsed.success) {
      return new AError('Failed to parse Google Ads accounts data');
    }

    const channelAccounts = parsed.data.map((account) => ({
      name: account.descriptiveName ?? account.resourceName,
      currency: account.currencyCode,
      externalId: account.id.toString(),
    }));

    return await saveAccounts(channelAccounts, integration);
  }

  async getReportStatus(_adAccount: AdAccountIntegration, _taskId: string): Promise<JobStatusEnum> {
    return Promise.reject(new AError('Not Implemented'));
  }

  async processReport(
    _adAccount: AdAccountIntegration,
    _taskId: string,
    _since: Date,
    _until: Date,
  ): Promise<AError | undefined> {
    return Promise.resolve(new AError('Not implemented'));
  }

  async runAdInsightReport(
    _adAccount: DbAdAccount,
    _integration: Integration,
    _since: Date,
    _until: Date,
  ): Promise<string | AError> {
    return Promise.resolve(new AError('Not implemented'));
  }

  private static async handlePagination<T, U extends ZodTypeAny>(
    integration: Integration,
    query: string,
    schema: ZodSchema<GenericResponse<T>>,
    customerId?: string,
    _parseCallback?: (result: z.infer<U>) => T,
  ): Promise<AError | GenericResponse<T>['results']> {
    const refreshedIntegration = await Google.refreshedIntegration(integration);
    if (isAError(refreshedIntegration)) return refreshedIntegration;

    const url = `${baseUrl}/customers/${customerId ?? integration.externalId}/googleAds:search`;
    const baseHeaders = {
      'Content-Type': 'application/json',
      'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
      'login-customer-id': integration.externalId,
      Authorization: `Bearer ${integration.accessToken}`,
    };

    const res = [];
    let nextPageToken: string | null = null;

    do {
      const headers: Record<string, string> = {
        ...baseHeaders,
        ...(nextPageToken && { page_token: nextPageToken }),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,

        body: JSON.stringify({ query }),
      }).catch(() => {
        return new AError('Error fetching video ads');
      });

      if (response instanceof Error) return response;

      const adsResponse: unknown = await response.json();

      if (isAError(adsResponse)) return res;
      const validatedResponse = schema.parse(adsResponse);
      if (validatedResponse.results) {
        res.push(...validatedResponse.results);
      }

      nextPageToken = validatedResponse.nextPageToken ?? null;
    } while (nextPageToken);

    return res;
  }

  private static deviceEnumMap: Map<string, DeviceEnum> = new Map<string, DeviceEnum>([
    ['MOBILE', DeviceEnum.MobileApp],
    ['TABLET', DeviceEnum.Tablet],
    ['DESKTOP', DeviceEnum.Desktop],
    ['CONNECTED_TV', DeviceEnum.ConnectedTv],
    ['UNKNOWN', DeviceEnum.Unknown],
    ['UNSPECIFIED', DeviceEnum.Unknown],
    ['OTHER', DeviceEnum.Unknown],
  ]);

  private static async findManagerAccount(accessToken: string, customerIds: string[]): Promise<string | AError> {
    for (const customerId of customerIds) {
      const url = `${baseUrl}/customers/${customerId.split('/')[1]}/googleAds:search`;

      const query = `
        SELECT
          customer_client.client_customer,
          customer_client.manager
        FROM
          customer_client
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query }),
      }).catch(() => {
        logger.error(`Failed to fetch for the following customer: ${customerId}`);
        return new AError('Error fetching for the following customer');
      });

      if (response instanceof Error) return response;

      const data: unknown = await response.json();

      const validatedResponse = defaultQueryResponseSchema.parse(data);

      if (validatedResponse.results) {
        const managers = validatedResponse.results
          .map((result) => result.customerClient)
          .filter((customer) => customer.manager)
          .map((customer) => ({
            customerId: customer.clientCustomer.replace('customers/', ''),
            descriptiveName: customer.descriptiveName,
          }));

        if (managers.length) return customerId.split('/')[1];
      }
    }
    logger.error('No manager account found');
    return new AError('No manager account found');
  }

  getType(): IntegrationTypeEnum {
    return IntegrationTypeEnum.GOOGLE;
  }
}

const disConnectIntegrationOnError = async (integrationId: string, error: Error): Promise<boolean> => {
  // console.log(error.message, 'THIS IS ERROR')
  if (error.message === 'invalid_grant') {
    await markStatusIntegrationById(integrationId, IntegrationStatus.ERRORED);
    return true;
  }
  return false;
};

export const google = new Google();
