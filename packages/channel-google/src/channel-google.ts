import { createHmac } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import { OAuth2Client } from 'google-auth-library';
import {
  CurrencyEnum,
  type AdAccount as DbAdAccount,
  type DeviceEnum,
  type Integration,
  IntegrationTypeEnum,
  prisma,
  PublisherEnum,
} from '@repo/database';
import { addInterval, AError, FireAndForget, formatYYYMMDDDate, isAError } from '@repo/utils';
import { z, type ZodSchema, type ZodTypeAny } from 'zod';
import { logger } from '@repo/logger';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import {
  type AdAccountIntegration,
  type AdWithAdAccount,
  authEndpoint,
  type ChannelAd,
  type ChannelCreative,
  type ChannelIFrame,
  type ChannelInterface,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  getIFrame,
  type JobStatusEnum,
  markErrorIntegrationById,
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
  responseSchema,
  videoAdResponseSchema,
} from './schema';

const fireAndForget = new FireAndForget();

const baseUrl = 'https://googleads.googleapis.com';
const apiVersion = 'v18';

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
    const url = `${baseUrl}/v18/customers:listAccessibleCustomers`;

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

    const refreshedIntegration = await this.refreshedIntegration(integration);
    if (isAError(refreshedIntegration)) return refreshedIntegration;

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
      if (await disConnectIntegrationOnError(integration.id, error, false)) {
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

    interface ResponseData {
      access_token: string;
      expires_in: number;
    }

    const response: ResponseData = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
      .then((res) => res.json() as Promise<ResponseData>)
      .catch(() => {
        throw new AError(`Failed to refresh token`);
      });

    const schema = z.object({
      access_token: z.string(),
      expires_in: z.number().int(),
      refresh_token: z.string(),
      refresh_token_expires_in: z.null(),
      scope: z.string(),
    });

    const updatedToken = {
      ...response,
      refresh_token: integration.refreshToken,
      refresh_token_expires_in: null,
    };

    const parsed = schema.safeParse(updatedToken);
    if (!parsed.success) {
      logger.error(parsed.error, 'Failed to parse refresh access token response');
      return new AError('Failed to parse refresh access token response');
    }

    return await updateIntegrationTokens(integration, {
      accessToken: parsed.data.access_token,
      accessTokenExpiresAt: addInterval(new Date(), 'seconds', parsed.data.expires_in),
      refreshToken: parsed.data.refresh_token,
      refreshTokenExpiresAt: addInterval(new Date(), 'seconds', 7776000000), // TODO: Add dynamic expire time
    });
  }

  async refreshedIntegration(integration: Integration): Promise<Integration | AError> {
    const expiresAt =
      typeof integration.accessTokenExpiresAt === 'string'
        ? new Date(integration.accessTokenExpiresAt)
        : integration.accessTokenExpiresAt;

    const oneHourFromNow = addInterval(new Date(), 'seconds', 60 * 60);

    if (expiresAt && expiresAt.getTime() < oneHourFromNow.getTime()) {
      return await google.refreshAccessToken(integration);
    }

    return integration;
  }

  async getAdAccountData(
    integration: Integration,
    dbAccount: DbAdAccount,
    initial: boolean,
  ): Promise<AError | undefined> {
    if (!integration.refreshToken) return new AError('Refresh token is required');

    const ranges = await timeRanges(initial, dbAccount.id);

    for (const range of ranges) {
      try {
        const refreshedIntegration = await this.refreshedIntegration(integration);
        if (isAError(refreshedIntegration)) return refreshedIntegration;

        const url = `${baseUrl}/${apiVersion}/customers/${dbAccount.externalId}/googleAds:search`;

        const videoQuery = `
      SELECT 
            video.id,
            video.title,
            video.duration_millis,
            
            ad_group_ad.ad.id,
            ad_group_ad.ad.name,
            ad_group_ad.ad.type,
            
            ad_group_ad.ad.video_responsive_ad.breadcrumb1,
            ad_group_ad.ad.video_responsive_ad.breadcrumb2,
            ad_group_ad.ad.video_responsive_ad.call_to_actions,
            ad_group_ad.ad.video_responsive_ad.companion_banners,
            ad_group_ad.ad.video_responsive_ad.descriptions,
            ad_group_ad.ad.video_responsive_ad.headlines,
            ad_group_ad.ad.video_responsive_ad.long_headlines,
            ad_group_ad.ad.video_responsive_ad.videos,
            
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
        segments.ad_format_type
      FROM video
      WHERE segments.date BETWEEN '${formatYYYMMDDDate(range.since)}' AND '${formatYYYMMDDDate(range.until)}'
    `;

        const youtubeData = await Google.handlePagination(
          refreshedIntegration,
          videoQuery,
          videoAdResponseSchema,
          dbAccount.externalId,
        );

        if (!youtubeData || isAError(youtubeData)) return;

        const campaignGroup = youtubeData.map((el) => ({
          externalId: String(el.campaign.id),
          name: el.campaign.name,
          externalAdAccountId: dbAccount.externalId,
        }));

        const adSets = youtubeData.map((el) => ({
          externalId: String(el.adGroup.id),
          name: el.adGroup.name,
          externalCampaignId: el.campaign.id,
        }));

        const ads: ChannelAd[] = youtubeData.map((c) => ({
          externalAdAccountId: dbAccount.externalId,
          externalId: c.adGroupAd.ad.id,
          externalAdSetId: String(c.adGroup.id),
        }));

        const creatives: ChannelCreative[] = [];

        for (const el of youtubeData) {
          if (el.adGroupAd.ad.videoResponsiveAd !== undefined) {
            const query = `
                  SELECT
                  asset.id,
                  asset.name,
                  asset.type,
                  asset.resource_name,
                  asset.youtube_video_asset.youtube_video_id,
                  asset.image_asset.file_size,
                  asset.image_asset.full_size.url,
                  asset.image_asset.mime_type,
                  asset.text_asset.text
                FROM
                  asset
                WHERE
                  asset.resource_name IN (${el.adGroupAd.ad.videoResponsiveAd.videos.map((c) => `'${c.asset}'`).join(',')})
              `;

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
                'login-customer-id': integration.externalId,
                Authorization: `Bearer ${refreshedIntegration.accessToken}`,
              },
              body: JSON.stringify({ query }),
            }).catch(() => {
              return new AError('Error fetching video ads');
            });

            if (response instanceof Error) return response;

            const jsonResponse: unknown = await response.json();

            const asset = assetResponseSchema.safeParse(jsonResponse);

            if (!asset.data?.results) continue;

            const flattenedCreatives: ChannelCreative[] = asset.data.results.map((c) => ({
              externalAdId: el.adGroupAd.ad.id,
              externalId: c.asset.id,
              adAccountId: dbAccount.id,
              name: c.asset.resourceName,
            }));

            creatives.push(...flattenedCreatives);
          }
        }

        await saveInsightsAdsAdsSetsCampaigns(
          campaignGroup,
          new Map<string, string>(),
          dbAccount,
          adSets,
          new Map<string, string>(),
          ads,
          new Map<string, string>(),
          creatives,
          new Map<string, string>(),
          [],
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
      const refreshedIntegration = await this.refreshedIntegration(integration);
      if (isAError(refreshedIntegration)) return refreshedIntegration;

      const query = `
         SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ad_group_ad.ad.final_urls
        FROM
          ad_group_ad
        WHERE
          ad_group_ad.ad.id = '${externalId}'
      `;
      const response = await Google.handlePagination(refreshedIntegration, query, responseSchema, adAccount.externalId);

      if (isAError(response)) return new AError('Error while fetching google ad');

      const validatedResponse = responseSchema.parse(response);
      if (!validatedResponse.results) return new AError('No data found');

      if (!validatedResponse.results[0].adGroupAd.resourceName) {
        return new AError('getGoogleAdPreview: Ad not found or insufficient permissions.');
      }

      const adData = validatedResponse.results[0].adGroupAd;

      const previewHTML = `
      <iframe
        title="${adData.ad.name ?? ''}"
        src="${adData.ad.finalUrls?.[0] ?? ''}"
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
    const delay = (ms: number): Promise<void> =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    const refreshedIntegration = await this.refreshedIntegration(integration);

    if (isAError(refreshedIntegration)) return refreshedIntegration;

    const defaultQuery = `
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

    const response = await Google.handlePagination(refreshedIntegration, defaultQuery, defaultQueryResponseSchema);

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
        refreshedIntegration,
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

      await delay(100);
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

  async saveCreatives(_integration: Integration, _groupByAdAccount: Map<string, AdWithAdAccount[]>): Promise<void> {
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
    const url = `${baseUrl}/${apiVersion}/customers/${customerId ?? integration.externalId}/googleAds:search`;
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

  private static async findManagerAccount(accessToken: string, customerIds: string[]): Promise<string | AError> {
    for (const customerId of customerIds) {
      const url = `${baseUrl}/v18/customers/${customerId.split('/')[1]}/googleAds:search`;

      const query = `
        SELECT
          customer_client.client_customer,
          customer_client.level,
          customer_client.manager,
          customer_client.descriptive_name
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
          .filter((custoemer) => custoemer.manager)
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
