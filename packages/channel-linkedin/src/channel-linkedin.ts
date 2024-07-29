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
  authEndpoint,
  type ChannelAd,
  type ChannelAdAccount,
  type ChannelIFrame,
  type ChannelInsight,
  type ChannelInterface,
  deleteOldInsights,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  getIFrame,
  JobStatusEnum,
  type ProcessReportReq,
  revokeIntegrationById,
  type RunAdInsightReportReq,
  saveAccounts,
  saveAds,
  saveInsights,
  timeRange,
  type TokensResponse,
} from '@repo/channel-utils';
import { env } from './config';

const authClient = new AuthClient({
  clientId: env.LINKEDIN_APPLICATION_ID,
  clientSecret: env.LINKEDIN_APPLICATION_SECRET,
  redirectUrl: `${env.API_ENDPOINT}${authEndpoint}`,
});

const restliClient = new RestliClient();
const versionString = '202405';
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
      const analytics = await this.getAdAnalytics(integration, initial, dbAccount);
      if (isAError(analytics)) return analytics;

      const adExternalIdMap = await this.saveCreativesAsAds(integration, analytics.creativeIds, dbAccount);
      if (isAError(adExternalIdMap)) return adExternalIdMap;

      await deleteOldInsights(dbAccount.id, initial);
      await saveInsights(analytics.insights, adExternalIdMap, dbAccount);
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

  private async getAdAnalytics(
    integration: Integration,
    initial: boolean,
    dbAccount: AdAccount,
  ): Promise<AError | { creativeIds: Set<string>; insights: ChannelInsight[] }> {
    const params = {
      q: 'statistics',
      pivots: 'List(CREATIVE,IMPRESSION_DEVICE_TYPE)',
      timeGranularity: 'DAILY',
      accounts: `List(${encodeURIComponent(`urn:li:sponsoredAccount:${dbAccount.externalId}`)})`,
      dateRange: await linkedInTimeRange(initial, dbAccount.id),
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
    const creativeIds = new Set<string>();
    const insights: ChannelInsight[] = adAnalytics
      .map((a) => {
        const creativeExternalId = a.pivotValues.find((v) => v.startsWith('urn:li:sponsoredCreative:'))?.split(':')[3];
        if (!creativeExternalId) return undefined;
        creativeIds.add(creativeExternalId);
        const device = a.pivotValues.find((v) => Array.from(LinkedIn.deviceEnumMap.keys()).includes(v));
        return {
          externalAdId: creativeExternalId,
          date: new Date(a.dateRange.start.year, a.dateRange.start.month - 1, a.dateRange.start.day),
          externalAccountId: dbAccount.externalId,
          impressions: a.impressions,
          spend: a.costInLocalCurrency * 100,
          device: device ? LinkedIn.deviceEnumMap.get(device) ?? DeviceEnum.Unknown : DeviceEnum.Unknown,
          publisher: PublisherEnum.LinkedIn,
          position: '',
        };
      })
      .flatMap((i) => (i ? [i] : []));
    return { creativeIds, insights };
  }

  async saveCreativesAsAds(
    integration: Integration,
    creativeIds: Set<string>,
    dbAccount: AdAccount,
  ): Promise<AError | Map<string, string>> {
    const channelAds: ChannelAd[] = Array.from(creativeIds).map((c) => ({
      externalAdAccountId: dbAccount.externalId,
      externalId: c,
    }));
    const adExternalIdMap = new Map<string, string>();
    await saveAds(integration, channelAds, dbAccount.id, adExternalIdMap);
    return adExternalIdMap;
  }

  // This will prove useful when we will start saving campaigns
  private async getAndSaveCampaigns(
    integration: Integration,
    campaignIds: Set<string>,
    dbAccount: AdAccount,
  ): Promise<AError | z.infer<typeof schema>[]> {
    const params = {
      q: 'search',
      search: `(id:(values:List(${Array.from(campaignIds).join(',')})))`,
    };
    const schema = z.object({ name: z.string(), id: z.number().int() });
    return await LinkedIn.handlePagination(
      integration,
      `/adAccounts/${dbAccount.externalId}/adCampaigns?${queryParams(params)}`,
      schema,
    );
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
    const response = await LinkedIn.parseLinkedInResponse(responseP, schema);
    if (isAError(response)) return response;
    res.push(...response.elements);
    let next = response.next;
    while (next) {
      const nextResponse = fetch(`${baseUrl}${next.href}`, {
        headers,
      });
      const nextResponseParsed = await LinkedIn.parseLinkedInResponse(nextResponse, schema);
      if (isAError(nextResponseParsed)) return nextResponseParsed;
      res.push(...nextResponseParsed.elements);
      next = nextResponseParsed.next;
    }
    return res;
  }

  private static async parseLinkedInResponse<T extends ZodTypeAny>(
    responseP: Promise<Response>,
    schema: T,
  ): Promise<AError | { next: { rel: string; href: string } | undefined; elements: T[] }> {
    const response = await responseP.catch((error: unknown) => {
      logger.error(error, 'Failed to fetch data in parseLinkedInResponse');
      return new AError('Failed to fetch data');
    });
    if (isAError(response)) return response;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const body = await response.json();
    if (!response.ok) {
      logger.error(body, 'Failed to fetch data');
      return new AError('Failed to fetch data');
    }
    const bigSchema = z.object({
      elements: schema.array(),
      paging: z.object({
        links: z.array(z.object({ rel: z.string(), href: z.string() })),
      }),
    });
    const parsed = bigSchema.safeParse(body);
    if (!parsed.success) {
      const msg = 'Failed to parse data in linkedIn pagination call';
      logger.error(parsed.error, msg);
      return new AError(msg);
    }
    const next = parsed.data.paging.links.find((l) => l.rel === 'next');
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

  getReportStatus(_input: Omit<ProcessReportReq, 'initial'>): Promise<JobStatusEnum> {
    return Promise.resolve(JobStatusEnum.FAILED);
  }

  processReport(_input: ProcessReportReq): Promise<AError | undefined> {
    return Promise.resolve(new AError('Not implemented'));
  }

  runAdInsightReport(_input: RunAdInsightReportReq): Promise<string | AError> {
    return Promise.resolve(new AError('Not implemented'));
  }
}

const disConnectIntegrationOnError = async (integrationId: string, error: Error, notify: boolean): Promise<boolean> => {
  const revocableMessages = [
    'Empty oauth2 access token',
    'The token used in the request has been revoked by the user',
    'The provided authorization grant or refresh token is invalid, expired or revoked.',
  ];
  if (revocableMessages.includes(error.message)) {
    await revokeIntegrationById(integrationId, notify);
    return true;
  }
  return false;
};

const linkedInTimeRange = async (initial: boolean, adAccountId: string): Promise<string> => {
  const range = await timeRange(initial, adAccountId);
  const { year, month, day } = extractDate(range.since);
  return `(start:(year:${String(year)},month:${month},day:${day}))`;
};

const queryParams = (params: Record<string, string>): string => {
  const qParams = Object.entries(params).reduce<string[]>((acc, [key, value]) => {
    acc.push(`${key}=${value}`);
    return acc;
  }, []);
  return qParams.join('&');
};

export const linkedIn = new LinkedIn();
