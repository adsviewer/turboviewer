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
import { addInterval, AError, FireAndForget, isAError } from '@repo/utils';
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
  JobStatusEnum,
  markErrorIntegrationById,
  revokeIntegration,
  saveAccounts,
  saveInsightsAdsAdsSetsCampaigns,
  type TokensResponse,
  updateIntegrationTokens,
} from '@repo/channel-utils';
import { decode, type JwtPayload } from 'jsonwebtoken';
import { env } from './config';
import {
  AssetResponseSchema,
  CustomerQueryResponseSchema,
  DefaultQueryResponseSchema,
  ResponseSchema,
  VideoAdResponseSchema,
} from './schema';

const fireAndForget = new FireAndForget();

interface GenericResponse<T> {
  requestId?: string;
  queryResourceConsumption?: string;
  results?: T[];
  fieldMask?: string;
}

type VideoAdResponse = z.infer<typeof VideoAdResponseSchema>;

// const limit = 600;

const client = new OAuth2Client(
  env.GOOGLE_CHANNEL_APPLICATION_ID,
  env.GOOGLE_CHANNEL_APPLICATION_SECRET,
  `${env.API_ENDPOINT}${authEndpoint}`,
);

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
    const accessToken = getTokenResponse.tokens.access_token;
    const idToken = getTokenResponse.tokens.id_token;

    if (!idToken) {
      return new AError('No id_token in response');
    }

    const decoded = decode(idToken) as GoogleJwtPayload | null;
    if (!decoded) {
      return new AError('Could not decode id_token');
    }
    if (!accessToken) return new AError('Could not get access_token');
    if (!refreshToken) return new AError('Could not refresh token');

    if (getTokenResponse.tokens.expiry_date) {
      return {
        accessToken,
        accessTokenExpiresAt: new Date(Date.now() + getTokenResponse.tokens.expiry_date * 1000),
        refreshToken,
      };
    }
    const accessTokenExpiresAt = null;
    if (isAError(accessTokenExpiresAt)) return accessTokenExpiresAt;

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
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

      return parsed.data.id;
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

    const refreshedIntegration = await Google.refreshedIntegration(integration);
    if (isAError(refreshedIntegration)) return refreshedIntegration;

    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${refreshedIntegration.accessToken}`;

    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).catch((error: unknown) => {
      logger.error('Failed to de-authorize %o', { error });
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    });

    if (response instanceof Error) return response;
    if (!response.ok) {
      const error = new Error('De-authorization request failed');
      logger.error('De-authorization request failed', { response });
      if (await disConnectIntegrationOnError(integration.id, error, false)) {
        return integration.externalId;
      }
      return error;
    }

    return integration.externalId;
  }

  async refreshAccessToken(integration: Integration): Promise<Integration | AError> {
    if (!integration.refreshToken) throw new AError('No refresh token found');
    const url = 'https://www.googleapis.com/oauth2/v3/token';

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', env.GOOGLE_CHANNEL_APPLICATION_ID);
    params.append('client_secret', env.GOOGLE_CHANNEL_APPLICATION_SECRET);
    params.append('refresh_token', env.GOOGLE_CHANNEL_REFRESH_TOKEN);

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
      refresh_token: env.GOOGLE_CHANNEL_REFRESH_TOKEN,
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

  private static async refreshedIntegration(integration: Integration): Promise<Integration | AError> {
    if (
      integration.accessTokenExpiresAt &&
      integration.accessTokenExpiresAt.getTime() < addInterval(new Date(), 'seconds', 60 * 5).getTime()
    ) {
      return await google.refreshAccessToken(integration);
    }
    return integration;
  }

  async getAdAccountData(
    integration: Integration,
    dbAccount: DbAdAccount,
    _initial: boolean,
  ): Promise<AError | undefined> {
    const dbAccounts = await this.saveAdAccounts(integration);
    if (isAError(dbAccounts)) return dbAccounts;
    if (!integration.refreshToken) return new AError('Refresh token is required');

    try {
      const refreshedIntegration = await Google.refreshedIntegration(integration);
      if (isAError(refreshedIntegration)) return refreshedIntegration;
      const customers = await fetchGoogleAdsData(refreshedIntegration.accessToken, DefaultQueryResponseSchema);

      if (isAError(customers)) throw new AError('Failed to fetch customers');
      const url = `https://googleads.googleapis.com/v18/customers/${dbAccount.externalId}/googleAds:search`;

      const youtubeData = await getAllYoutubeAds(
        dbAccount.externalId,
        refreshedIntegration.accessToken,
        '2024-09-01',
        '2024-09-02',
      );

      if (!youtubeData) return;

      if (isAError(youtubeData)) return;

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

      // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
              'login-customer-id': env.GOOGLE_CHANNEL_TEMP_CUSTOMER_ID,
              Authorization: `Bearer ${refreshedIntegration.accessToken}`,
            },
            body: JSON.stringify({ query }),
          }).catch(() => {
            throw new AError('Error fetching video ads');
          });

          const jsonResponse: unknown = await response.json();

          const asset = AssetResponseSchema.parse(jsonResponse);

          if (asset instanceof Error) return asset;

          if (!asset.results) continue;

          const flattenedCreatives: ChannelCreative[] = asset.results.map((c) => ({
            externalAdId: '',
            externalId: c.asset.id,
            adAccountId: dbAccount.id,
            name: c.asset.resourceName,
            type: c.asset.type,
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
      const refreshedIntegration = await Google.refreshedIntegration(integration);
      if (isAError(refreshedIntegration)) return refreshedIntegration;

      const query = `
         SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ad_group_ad.ad.type,
          ad_group_ad.ad.final_urls,
          ad_group_ad.ad.responsive_search_ad.headlines,
          ad_group_ad.ad.responsive_search_ad.descriptions,
          ad_group_ad.ad.responsive_display_ad.marketing_images,
          ad_group_ad.ad.responsive_display_ad.square_marketing_images,
          ad_group_ad.ad.video_responsive_ad.headlines,
          ad_group_ad.ad.video_responsive_ad.descriptions,
          ad_group_ad.ad.video_responsive_ad.videos
        FROM
          ad_group_ad
        WHERE
          ad_group_ad.ad.id = '${externalId}'
      `;
      const response = await fetchGoogleAdsData(
        refreshedIntegration.accessToken,
        ResponseSchema,
        query,
        adAccount.externalId,
      );

      if (isAError(response)) throw new AError('Error while fetching google ad');

      const validatedResponse = ResponseSchema.parse(response);
      if (!validatedResponse.results) throw new AError('No data found');

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
    const refreshedIntegration = await Google.refreshedIntegration(integration);
    if (isAError(refreshedIntegration)) return refreshedIntegration;

    const response = await fetchGoogleAdsData(refreshedIntegration.accessToken, DefaultQueryResponseSchema);

    if (isAError(response)) throw new AError('Error fetching google customers');

    if (!response.results) throw new AError('No data found');
    const updatedCustomers = [];

    for (const customer of response.results) {
      const currencyCodeQuery = `
          SELECT
            customer.id,
            customer.currency_code
          FROM
            customer
        `;

      const currencyCode = await fetchGoogleAdsData(
        refreshedIntegration.accessToken,
        CustomerQueryResponseSchema,
        currencyCodeQuery,
        customer.customerClient.clientCustomer.split('/')[1],
      );

      if (isAError(currencyCode)) throw new AError('Error fetching currency code');

      if (!currencyCode.results) throw new AError('No currency code found');

      const updatedCustomerClient = {
        resourceName: customer.customerClient.resourceName,
        currencyCode: currencyCode.results[0].customer.currencyCode || 'USD',
        id: customer.customerClient.clientCustomer.split('/')[1],
        descriptiveName: customer.customerClient.descriptiveName,
      };

      updatedCustomers.push(updatedCustomerClient);

      await delay(1000);
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
    return Promise.resolve(JobStatusEnum.FAILED);
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

  private static handlePagination<T, U extends ZodTypeAny>(
    _integration: Integration,
    _schema: U,
    _parseCallback: (result: z.infer<U>) => T,
  ): Promise<AError | T[]> {
    // const results: T[] = [];
    // let nextPageToken: string | undefined = '';

    // do {
    //   const response = await fetchFn(nextPageToken);
    //   if (isAError(response)) return response; // Handle errors during fetching

    //   const arraySchema = z.array(schema);
    //   const parsed = arraySchema.safeParse(response.results || []);

    //   if (!parsed.success) {
    //     logger.error('Failed to parse response %o', response);
    //     return new AError('Failed to parse Google Ads paginated response');
    //   }

    //   results.push(...parsed.data.map(parseCallback));
    //   nextPageToken = response.nextPageToken; // Update pageToken for next iteration
    // } while (nextPageToken);

    throw new AError('Failed to parse Google Ads paginated response');
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

// const throttle = async (ms: number) => {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// };

// const splitDateRange = (start: string, end: string, chunkSize: number): { start: string; end: string }[] => {
//   const startDate = new Date(start);
//   const endDate = new Date(end);
//   const ranges: { start: string; end: string }[] = [];

//   const current = new Date(startDate);
//   while (current <= endDate) {
//     const chunkEnd = new Date(current);
//     chunkEnd.setDate(current.getDate() + chunkSize - 1);

//     ranges.push({
//       start: current.toISOString().split('T')[0],
//       end: chunkEnd > endDate ? endDate.toISOString().split('T')[0] : chunkEnd.toISOString().split('T')[0],
//     });

//     current.setDate(current.getDate() + chunkSize);
//   }

//   return ranges;
// };

const fetchGoogleAdsData = async <T>(
  accessToken: string,
  schema: ZodSchema<GenericResponse<T>>,
  query?: string,
  customerId?: string,
): Promise<GenericResponse<T> | AError> => {
  const managerId = env.GOOGLE_CHANNEL_TEMP_CUSTOMER_ID;

  const url = `https://googleads.googleapis.com/v18/customers/${customerId ?? managerId}/googleAds:search`;

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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
      'login-customer-id': managerId,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: query ?? defaultQuery }),
  }).catch(() => {
    throw new AError('Customer fetch failed');
  });

  if (response instanceof Error) throw new AError('Customer fetch failed');

  const googleAdsResponse: unknown = await response.json();

  const validatedResponse = schema.parse(googleAdsResponse);

  if (!validatedResponse.results) throw new AError('No data found');

  return validatedResponse;
};

const fetchYoutubeAds = async (
  accessToken: string,
  customerId: string,
  startDate: string,
  endDate: string,
  _delayMs = 1000,
  _pageToken = '',
): Promise<VideoAdResponse | AError> => {
  if (env.GOOGLE_CHANNEL_TEMP_CUSTOMER_ID === customerId || customerId === '9300825796') [];
  const url = `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`;

  if (isAError(accessToken)) throw new AError('Access token not generated');

  const query = `
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
    `;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'developer-token': env.GOOGLE_CHANNEL_DEVELOPER_TOKEN,
      'login-customer-id': env.GOOGLE_CHANNEL_TEMP_CUSTOMER_ID,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  }).catch(() => {
    throw new AError('Error fetching video ads');
  });

  if (response instanceof Error) throw new AError('Customer fetch failed');

  const youtubeData: unknown = await response.json();
  const validatedData = VideoAdResponseSchema.parse(youtubeData);

  // if (!validatedData) {
  //   logger.error(validatedData.error, 'Failed to parse refresh access token response');
  //   return new AError('Failed to parse refresh access token response');
  // }
  return validatedData;

  // const days = this.splitDateRange(startDate, endDate, 1);
  // return await fetchBatch(startDate, endDate);
  // for (const { start, end } of days) {

  //   // Throttle by introducing a delay between requests
  // }
  // await this.throttle(delayMs);
  // return allResults;
};

const getAllYoutubeAds = async (
  customerId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<z.infer<typeof VideoAdResponseSchema>['results'] | AError | undefined> => {
  // const allAds: any[] = [];
  const nextPageToken: string | undefined = '';

  // do {
  const response = await fetchYoutubeAds(accessToken, customerId, startDate, endDate, 1000, nextPageToken);
  if (isAError(response)) return response;
  // response.result/

  if (Array.isArray(response.results)) return response.results;

  // allAds = response.length ? [...allAds, ...response?.results] : [...allAds]
  //   nextPageToken = response.nextPageToken; // Check if there is a next page
  // } while (nextPageToken);
  // return allAds;
};

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
