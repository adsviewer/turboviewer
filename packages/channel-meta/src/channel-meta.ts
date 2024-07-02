import { createHmac } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import { CurrencyEnum, DeviceEnum, type Integration, IntegrationTypeEnum, prisma, PublisherEnum } from '@repo/database';
import { AError, FireAndForget, getDayPriorTillTomorrow, getLastXMonths, isAError } from '@repo/utils';
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
import _ from 'lodash';
import {
  type AdAccountEssential,
  authEndpoint,
  type ChannelAd,
  type ChannelAdAccount,
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
  MetaError,
  revokeIntegration,
  revokeIntegrationById,
  saveAccounts,
  saveAds,
  saveInsights,
  type TokensResponse,
} from '@repo/channel-utils';
import { env } from './config';

const fireAndForget = new FireAndForget();

const apiVersion = 'v20.0';
export const baseOauthFbUrl = `https://www.facebook.com/${apiVersion}`;
export const baseGraphFbUrl = `https://graph.facebook.com/${apiVersion}`;

class Meta implements ChannelInterface {
  generateAuthUrl(state: string): GenerateAuthUrlResp {
    const scopes = ['ads_read'];

    const params = new URLSearchParams({
      client_id: env.FB_APPLICATION_ID,
      scope: scopes.join(','),
      redirect_uri: `${env.API_ENDPOINT}${authEndpoint}`,
      state,
    });

    return {
      url: decodeURIComponent(`${baseOauthFbUrl}/dialog/oauth?${params.toString()}`),
    };
  }

  async exchangeCodeForTokens(code: string): Promise<TokensResponse | AError> {
    const params = new URLSearchParams({
      client_id: env.FB_APPLICATION_ID,
      client_secret: env.FB_APPLICATION_SECRET,
      redirect_uri: `${env.API_ENDPOINT}${authEndpoint}`,
      code,
    });

    const response = await fetch(`${baseGraphFbUrl}/oauth/access_token?${params.toString()}`).catch(
      (error: unknown) => {
        logger.error('Failed to exchange code for tokens %o', { error });
        return error instanceof Error ? error : new AError(JSON.stringify(error));
      },
    );

    if (response instanceof Error) return response;
    if (!response.ok) {
      return new AError(`Failed to exchange code for tokens: ${response.statusText}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const body = await response.json().catch((_e: unknown) => null);
    const tokenSchema = z.object({
      access_token: z.string().min(2),
      token_type: z.literal('bearer'),
      expires_in: z.number().optional(),
    });
    const parsed = tokenSchema.safeParse(body);
    if (!parsed.success) {
      return new AError('Failed to parse token response');
    }

    if (parsed.data.expires_in) {
      return {
        accessToken: parsed.data.access_token,
        accessTokenExpiresAt: new Date(Date.now() + parsed.data.expires_in * 1000),
      };
    }
    const accessTokenExpiresAt = await Meta.getExpireAt(parsed.data.access_token);
    if (isAError(accessTokenExpiresAt)) return accessTokenExpiresAt;
    return {
      accessToken: parsed.data.access_token,
      accessTokenExpiresAt,
    };
  }

  async getUserId(accessToken: string): Promise<string | AError> {
    const response = await fetch(`${baseGraphFbUrl}/me?fields=id&access_token=${accessToken}`).catch((e: unknown) => {
      logger.error('Error fetching fb user', e);
      return null;
    });
    if (!response?.ok) {
      return new AError('Failed to fetch user');
    }
    const parsed = z.object({ id: z.string() }).safeParse(await response.json());
    if (!parsed.success) {
      return new AError('Failed to fetch user');
    }
    return parsed.data.id;
  }

  signOutCallback(req: ExpressRequest, res: ExpressResponse): void {
    logger.info(`sign out callback body ${JSON.stringify(req.body)}`);

    const parsedBody = z.object({ signed_request: z.string() }).safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).send('Failed to parse sign out request');
      return;
    }
    const userId = Meta.parseRequest(parsedBody.data.signed_request, env.FB_APPLICATION_SECRET);
    if (isAError(userId)) {
      logger.error(userId.message);
      res.status(400).send(userId.message);
      return;
    }
    fireAndForget.add(() => revokeIntegration(userId, IntegrationTypeEnum.META));
    res.status(200).send('OK');
  }

  async deAuthorize(organizationId: string): Promise<string | AError | MetaError> {
    const integration = await getConnectedIntegrationByOrg(organizationId, IntegrationTypeEnum.META);
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
    if (!response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
      const json = await response.json();
      const fbErrorSchema = z.object({
        error: z.object({
          message: z.string(),
          code: z.number(),
          error_subcode: z.number(),
          fbtrace_id: z.string(),
        }),
      });
      const parsed = fbErrorSchema.safeParse(json);
      if (!parsed.success) {
        logger.error('De-authorization request failed due to %o', json);
        return new AError('Failed to de-authorize');
      }
      const metaError = new MetaError(
        parsed.data.error.message,
        parsed.data.error.code,
        parsed.data.error.error_subcode,
        parsed.data.error.fbtrace_id,
      );
      logger.error(metaError, 'De-authorization request failed');
      if (await disConnectIntegrationOnError(integration.id, metaError, false)) {
        return integration.externalId;
      }
      return metaError;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const data = await response.json();
    const parsed = z.object({ success: z.literal(true) }).safeParse(data);
    if (!parsed.success) {
      logger.error('Failed to de-authorize %o', data);
      return new AError('Failed to de-authorize');
    }
    return integration.externalId;
  }

  async getChannelData(integration: Integration, initial: boolean): Promise<AError | undefined> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const accounts = await this.getActiveAdAccounts(integration);
    if (isAError(accounts)) return accounts;
    logger.info(`Organization ${integration.organizationId} has ${JSON.stringify(accounts)} active accounts`);
    const dbAccounts = await saveAccounts(accounts, integration);

    const adReportsAccountMap = await this.runAdInsightReports(dbAccounts, initial, integration);
    if (isAError(adReportsAccountMap)) return adReportsAccountMap;

    const adExternalIdMap = new Map<string, string>();
    await this.waitAndProcessReports(adReportsAccountMap, integration, adExternalIdMap, initial);
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
    const parsedPreviews = await Meta.handlePagination(integration, previewsFn, previewSchema, toBody);
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

  private async getActiveAdAccounts(integration: Integration): Promise<ChannelAdAccount[] | AError> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const user = new User('me', {}, undefined, undefined);

    const getAdAccountsFn = user.getAdAccounts(
      [
        AdAccount.Fields.account_status,
        AdAccount.Fields.amount_spent,
        AdAccount.Fields.id,
        AdAccount.Fields.currency,
        AdAccount.Fields.name,
        `ads_volume{${AdAccountAdVolume.Fields.ads_running_or_in_review_count}}`,
      ],
      {
        limit: 500,
      },
    );
    const accountSchema = z.object({
      account_status: z.number(),
      amount_spent: z.coerce.number(),
      id: z.string().startsWith('act_'),
      currency: z.nativeEnum(CurrencyEnum),
      name: z.string(),
      ads_volume: z.object({ data: z.array(z.object({ ads_running_or_in_review_count: z.number() })) }),
    });
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- to complicated
    const toAccount = (acc: z.infer<typeof accountSchema>) => ({
      accountStatus: acc.account_status,
      amountSpent: acc.amount_spent,
      hasAdsRunningOrInReview: acc.ads_volume.data.some((adVolume) => adVolume.ads_running_or_in_review_count > 0),
      externalId: acc.id.slice(4),
      currency: acc.currency,
      name: acc.name,
    });

    const accounts = await Meta.handlePagination(integration, getAdAccountsFn, accountSchema, toAccount);
    if (isAError(accounts)) return accounts;
    const activeAccounts = accounts.filter((acc) => acc.accountStatus === 1).filter((acc) => acc.amountSpent > 0);
    return activeAccounts.map((acc) => ({
      name: acc.name,
      currency: acc.currency,
      externalId: acc.externalId,
    })) satisfies ChannelAdAccount[];
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
          limit: 500,
        },
      );
      const accountCreatives = await Meta.handlePagination(integration, getAdsFn, adsSchema, toCreative);
      if (!isAError(accountCreatives)) creatives.push(...accountCreatives);
    }
    return creatives;
  }

  private async runAdInsightReports(
    accounts: AdAccountEssential[],
    initial: boolean,
    integration: Integration,
  ): Promise<AError | Map<string, AdAccountEssential>> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const adReportsAccountMap = new Map<string, AdAccountEssential>();
    const adReportRunSchema = z.object({ id: z.string() });

    for (const acc of accounts) {
      const account = new AdAccount(`act_${acc.externalId}`, {}, undefined, undefined);
      const resp = await Meta.sdk(
        async () =>
          account.getInsightsAsync(
            [
              AdsInsights.Fields.account_id,
              AdsInsights.Fields.ad_id,
              AdsInsights.Fields.ad_name,
              AdsInsights.Fields.date_start,
              AdsInsights.Fields.spend,
              AdsInsights.Fields.impressions,
            ],
            {
              limit: 500,
              time_increment: 1,
              filtering: [{ field: AdsInsights.Fields.spend, operator: 'GREATER_THAN', value: '0' }],
              breakdowns: [
                AdsInsights.Breakdowns.device_platform,
                AdsInsights.Breakdowns.publisher_platform,
                AdsInsights.Breakdowns.platform_position,
              ],
              level: AdsInsights.Level.ad,
              time_range: await timeRange(initial, acc.id),
            },
          ),
        integration,
      );
      if (isAError(resp)) return resp;
      const parsed = adReportRunSchema.safeParse(resp);
      if (!parsed.success) {
        logger.error('Failed to parse ad report run %o', resp);
        return new AError('Failed to parse meta ad report run');
      }
      adReportsAccountMap.set(resp.id, acc);
    }
    return adReportsAccountMap;
  }

  private async waitAndProcessReports(
    adReportsAccountMap: Map<string, AdAccountEssential>,
    integration: Integration,
    adExternalIdMap: Map<string, string>,
    initial: boolean,
  ): Promise<AError | undefined> {
    const jobStatusEnum = z.enum([
      'Job Not Started',
      'Job Started',
      'Job Running',
      'Job Completed',
      'Job Failed',
      'Job Skipped',
    ]);

    const adReportsAccountMapCopy = new Map(adReportsAccountMap);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition -- Uses break
    while (true) {
      for (const [reportId, dbAccount] of adReportsAccountMapCopy) {
        const report = new AdReportRun(reportId, { report_run_id: reportId }, undefined, undefined);
        const resp = await Meta.sdk(
          () => report.get([AdReportRun.Fields.async_status, AdReportRun.Fields.async_percent_completion]),
          integration,
        );
        const reportSchema = z.object({
          [AdReportRun.Fields.async_status]: jobStatusEnum,
          [AdReportRun.Fields.async_percent_completion]: z.number(),
        });
        const parsed = reportSchema.safeParse(resp);
        if (!parsed.success) {
          logger.error('Failed to parse ad report %o', resp);
          return new AError('Failed to parse meta ad report');
        }
        const item = {
          percent: parsed.data.async_percent_completion,
          status: parsed.data.async_status,
        };
        if (item.status === 'Job Failed') {
          logger.error('Ad report failed %o', resp);
          adReportsAccountMapCopy.delete(reportId);
        }
        if (item.status === 'Job Completed') {
          await deleteOldInsights(dbAccount.id, initial);
          await this.getAndSaveAdsAndInsights(reportId, integration, adExternalIdMap, dbAccount);
          adReportsAccountMapCopy.delete(reportId);
        }
      }

      if (adReportsAccountMapCopy.size === 0) {
        logger.info('All reports completed');
        break;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }
  }

  private async getAndSaveAdsAndInsights(
    reportId: string,
    integration: Integration,
    adExternalIdMap: Map<string, string>,
    dbAccount: AdAccountEssential,
  ): Promise<AError | undefined> {
    const insightSchema = z.object({
      account_id: z.string(),
      ad_id: z.string(),
      ad_name: z.string(),
      date_start: z.coerce.date(),
      impressions: z.coerce.number(),
      spend: z.coerce.number(),
      device_platform: z.string(),
      publisher_platform: z.string(),
      platform_position: z.string(),
    });

    const toInsightAndAd = (insight: z.infer<typeof insightSchema>): { insight: ChannelInsight; ad: ChannelAd } => ({
      insight: {
        externalAdId: insight.ad_id,
        date: insight.date_start,
        externalAccountId: insight.account_id,
        impressions: insight.impressions,
        spend: Math.trunc(insight.spend * 100), // converting to cents
        device: Meta.deviceEnumMap.get(insight.device_platform) ?? DeviceEnum.Unknown,
        publisher: Meta.publisherEnumMap.get(insight.publisher_platform) ?? PublisherEnum.Unknown,
        position: insight.platform_position,
      },
      ad: {
        externalAdAccountId: insight.account_id,
        externalId: insight.ad_id,
        name: insight.ad_name,
      },
    });

    logger.info('Getting insights for report %s', reportId);

    const report = new AdReportRun(reportId, { report_run_id: reportId }, undefined, undefined);
    const getInsightsFn = report.getInsights(
      [
        AdsInsights.Fields.account_id,
        AdsInsights.Fields.ad_id,
        AdsInsights.Fields.ad_name,
        AdsInsights.Fields.date_start,
        AdsInsights.Fields.spend,
        AdsInsights.Fields.impressions,
        AdsInsights.Breakdowns.device_platform,
        AdsInsights.Breakdowns.publisher_platform,
        AdsInsights.Breakdowns.platform_position,
      ],
      {
        limit: 500,
      },
    );
    const insightsProcessFn = async (i: { insight: ChannelInsight; ad: ChannelAd }[]): Promise<undefined> => {
      await this.saveAdsAndInsights(i, adExternalIdMap, integration, dbAccount);
      return undefined;
    };
    const accountInsightsAndAds = await Meta.handlePaginationFn(
      integration,
      getInsightsFn,
      insightSchema,
      toInsightAndAd,
      insightsProcessFn,
    );
    if (isAError(accountInsightsAndAds)) return accountInsightsAndAds;
  }

  private async saveAdsAndInsights(
    accountInsightsAndAds: { insight: ChannelInsight; ad: ChannelAd }[],
    adExternalIdMap: Map<string, string>,
    integration: Integration,
    dbAccount: AdAccountEssential,
  ): Promise<void> {
    const [insights, ads] = accountInsightsAndAds.reduce(
      (acc, item) => {
        acc[0].push(item.insight);
        acc[1].push(item.ad);
        return acc;
      },
      [[] as ChannelInsight[], [] as ChannelAd[]],
    );
    const uniqueAds = _.uniqBy(ads, (ad) => ad.externalId);
    const newAds = uniqueAds.filter((ad) => !adExternalIdMap.has(ad.externalId));
    await saveAds(integration, newAds, dbAccount.id, adExternalIdMap);

    await saveInsights(insights, adExternalIdMap, dbAccount);
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
      return new AError('Failed to parse meta paginated response');
    }
    const results = parsed.data.map(parseCallback);
    while (cursor.hasNext()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Will catch error
      const next = await this.sdk<T>(() => cursor.next(), integration);
      const parsedNext = arraySchema.safeParse(next);
      if (parsedNext.success) {
        results.push(...parsedNext.data.map(parseCallback));
      } else {
        logger.error('Failed to parse paginated %o', next);
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
      return new AError('Failed to parse meta paginated response');
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
        logger.error('Failed to parse paginated %o', next);
      }
    }
    return resultsP;
  }

  private static async sdk<T>(fn: () => Promise<T> | T | AError, integration: Integration): Promise<T | AError> {
    try {
      return await fn();
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
      `${baseGraphFbUrl}/debug_token?input_token=${accessToken}&access_token=${accessToken}`,
    ).catch((error: unknown) => {
      logger.error('Failed to debug token %o', { error });
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    });
    if (debugToken instanceof Error) return debugToken;
    if (!debugToken.ok) {
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
}

const timeRange = async (initial: boolean, adAccountId: string): Promise<{ until: string; since: string }> => {
  if (initial) return getLastXMonths();
  const latestInsight = await prisma.insight.findFirst({
    select: { date: true },
    where: { adAccountId },
    orderBy: { date: 'desc' },
  });
  return latestInsight ? getDayPriorTillTomorrow(latestInsight.date) : getLastXMonths();
};

const disConnectIntegrationOnError = async (integrationId: string, error: Error, notify: boolean): Promise<boolean> => {
  const metaErrorValidatingAccessTokenChangedSession =
    'Error validating access token: The session has been invalidated because the user changed their password or Facebook has changed the session for security reasons.';
  const metaErrorNotAuthenticated = 'Error validating access token: The user has not authorized application';
  if (
    error.message === metaErrorValidatingAccessTokenChangedSession ||
    error.message.startsWith(metaErrorNotAuthenticated)
  ) {
    await revokeIntegrationById(integrationId, notify);
    return true;
  }
  return false;
};

export const meta = new Meta();
