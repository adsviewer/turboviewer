import { createHmac, randomUUID } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import { CurrencyEnum, DeviceEnum, type Integration, IntegrationTypeEnum, prisma, PublisherEnum } from '@repo/database';
import { AError, isAError } from '@repo/utils';
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
import { env, MODE } from '../../../config';
import {
  type ChannelAd,
  type ChannelAdAccount,
  type ChannelCreative,
  type ChannelInsight,
  type ChannelInterface,
  type TokensResponse,
} from '../channel-interface';
import { FireAndForget } from '../../../fire-and-forget';
import {
  type AdAccountEssential,
  authEndpoint,
  getConnectedIntegrationByOrg,
  revokeIntegration,
  saveAccounts,
  saveAds,
  saveInsights,
} from '../integration-util';
import { getLastThreeMonths, getLastTwoDays } from '../../../utils/date-utils';
import { pubSub } from '../../../schema/pubsub';
import { getIFrameAdFormat } from './iframe-fb-helper';

const fireAndForget = new FireAndForget();

const apiVersion = 'v19.0';
export const baseOauthFbUrl = `https://www.facebook.com/${apiVersion}`;
export const baseGraphFbUrl = `https://graph.facebook.com/${apiVersion}`;

export class FbError extends AError {
  name = 'FacebookError';
  code: number;
  errorSubCode: number;
  fbTraceId: string;

  constructor(message: string, code: number, errorSubcode: number, fbtraceId: string) {
    super(message);
    this.code = code;
    this.errorSubCode = errorSubcode;
    this.fbTraceId = fbtraceId;
  }
}

class Facebook implements ChannelInterface {
  generateAuthUrl() {
    const state = `${MODE}_${IntegrationTypeEnum.FACEBOOK}_${randomUUID()}`;
    const scopes = ['ads_read'];

    const params = new URLSearchParams({
      client_id: env.FB_APPLICATION_ID,
      scope: scopes.join(','),
      redirect_uri: `${env.API_ENDPOINT}${authEndpoint}`,
      state,
    });

    return {
      url: decodeURIComponent(`${baseOauthFbUrl}/dialog/oauth?${params.toString()}`),
      state,
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

    if (isAError(response)) return response;
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
    const accessTokenExpiresAt = await Facebook.getExpireAt(parsed.data.access_token);
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
    const userId = Facebook.parseRequest(parsedBody.data.signed_request, env.FB_APPLICATION_SECRET);
    if (isAError(userId)) {
      logger.error(userId.message);
      res.status(400).send(userId.message);
      return;
    }
    fireAndForget.add(() => revokeIntegration(userId, IntegrationTypeEnum.FACEBOOK));
    res.status(200).send('OK');
  }

  async deAuthorize(organizationId: string): Promise<string | AError | FbError> {
    const integration = await getConnectedIntegrationByOrg(organizationId, IntegrationTypeEnum.FACEBOOK);
    if (!integration) return new AError('No integration found');

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
      return new FbError(
        parsed.data.error.message,
        parsed.data.error.code,
        parsed.data.error.error_subcode,
        parsed.data.error.fbtrace_id,
      );
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

  async getChannelData(
    integration: Integration,
    userId: string | undefined,
    initial: boolean,
  ): Promise<AError | undefined> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const accounts = await this.getAdAccounts();
    if (isAError(accounts)) return accounts;
    const activeAccounts = accounts.filter((acc) => acc.accountStatus === 1).filter((acc) => acc.amountSpent > 0);
    logger.info(`Organization ${integration.organizationId} has ${JSON.stringify(activeAccounts)} active accounts`);
    const dbAccounts = await saveAccounts(activeAccounts, integration);

    const adReportsAccountMap = await this.runAdInsightReports(dbAccounts, initial);
    if (isAError(adReportsAccountMap)) return adReportsAccountMap;

    const adExternalIdMap = new Map<string, string>();
    await this.waitAndProcessReports(adReportsAccountMap, integration, adExternalIdMap, userId);
    logger.info(`Created ${String(adReportsAccountMap.size)} reports`);
  }

  async getAdPreview(
    integration: Integration,
    adId: string,
    publisher?: PublisherEnum,
    device?: DeviceEnum,
    position?: string,
  ): Promise<string | AError> {
    adsSdk.FacebookAdsApi.init(integration.accessToken);
    const { externalId } = await prisma.ad.findUniqueOrThrow({ where: { id: adId } });
    const ad = new Ad(externalId);
    const format = getIFrameAdFormat(publisher, device, position);
    if (!format) {
      logger.error('Invalid ad format %o', { publisher, device, position, adId });
      return new AError('Invalid ad format');
    }
    const previews = await ad.getPreviews([AdPreview.Fields.body], {
      ad_format: format,
    });
    const previewSchema = z.object({ body: z.string() });
    const toBody = (preview: z.infer<typeof previewSchema>) => preview.body;
    const parsedPreviews = await Facebook.handlePagination(previews, previewSchema, toBody);
    if (isAError(parsedPreviews)) return parsedPreviews;
    if (parsedPreviews.length === 0) return new AError('No ad preview found');
    if (parsedPreviews.length > 1) return new AError('More than one ad previews found');
    return parsedPreviews[0];
  }

  getDefaultPublisher(): PublisherEnum {
    return PublisherEnum.Facebook;
  }

  private async getAdAccounts(accessToken?: string): Promise<ChannelAdAccount[] | AError> {
    if (accessToken) adsSdk.FacebookAdsApi.init(accessToken);
    const user = new User('me');

    const res = await user.getAdAccounts(
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
    const toAccount = (acc: z.infer<typeof accountSchema>) =>
      ({
        accountStatus: acc.account_status,
        amountSpent: acc.amount_spent,
        hasAdsRunningOrInReview: acc.ads_volume.data.some((adVolume) => adVolume.ads_running_or_in_review_count > 0),
        externalId: acc.id.slice(4),
        currency: acc.currency,
        name: acc.name,
      }) satisfies ChannelAdAccount;

    return await Facebook.handlePagination(res, accountSchema, toAccount);
  }

  private async getCreatives(accounts: ChannelAdAccount[], accessToken?: string): Promise<ChannelCreative[] | AError> {
    if (accessToken) adsSdk.FacebookAdsApi.init(accessToken);

    const creatives: ChannelCreative[] = [];
    const adsSchema = z.object({
      id: z.string(),
      account_id: z.string(),
      creative: z.object({ id: z.string(), name: z.string() }),
    });
    const toCreative = (ad: z.infer<typeof adsSchema>) => ({
      externalAdId: ad.id,
      externalId: ad.creative.id,
      name: ad.creative.name,
      externalAdAccountId: ad.account_id,
    });

    for (const acc of accounts) {
      const account = new AdAccount(`act_${acc.externalId}`);
      const res = await account.getAds(
        [Ad.Fields.id, Ad.Fields.account_id, `creative{${AdCreative.Fields.id}, ${AdCreative.Fields.name}}`],
        {
          limit: 500,
        },
      );
      const accountCreatives = await Facebook.handlePagination(res, adsSchema, toCreative);
      if (!isAError(accountCreatives)) creatives.push(...accountCreatives);
    }
    return creatives;
  }

  private async runAdInsightReports(
    accounts: AdAccountEssential[],
    initial: boolean,
    accessToken?: string,
  ): Promise<AError | Map<string, AdAccountEssential>> {
    if (accessToken) adsSdk.FacebookAdsApi.init(accessToken);

    const adReportsAccountMap = new Map<string, AdAccountEssential>();
    const adReportRunSchema = z.object({ id: z.string() });

    for (const acc of accounts) {
      const account = new AdAccount(`act_${acc.externalId}`);
      const resp = await account.getInsightsAsync(
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
          time_range: initial ? getLastThreeMonths() : getLastTwoDays(),
        },
      );
      const parsed = adReportRunSchema.safeParse(resp);
      if (!parsed.success) {
        logger.error('Failed to parse ad report run %o', resp);
        return new AError('Failed to parse facebook ad report run');
      }
      adReportsAccountMap.set(resp.id, acc);
    }
    return adReportsAccountMap;
  }

  private async waitAndProcessReports(
    adReportsAccountMap: Map<string, AdAccountEssential>,
    integration: Integration,
    adExternalIdMap: Map<string, string>,
    userId?: string,
  ): Promise<AError | undefined> {
    const jobStatusEnum = z.enum([
      'Job Not Started',
      'Job Started',
      'Job Running',
      'Job Completed',
      'Job Failed',
      'Job Skipped',
    ]);
    type JobStatus = z.infer<typeof jobStatusEnum>;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition -- Uses break
    while (true) {
      const status: { percent: number; status: JobStatus }[] = [];

      for (const [reportId, dbAccount] of adReportsAccountMap) {
        const report = new AdReportRun(reportId, { report_run_id: reportId });
        const resp = await report.get([AdReportRun.Fields.async_status, AdReportRun.Fields.async_percent_completion]);
        const reportSchema = z.object({
          [AdReportRun.Fields.async_status]: jobStatusEnum,
          [AdReportRun.Fields.async_percent_completion]: z.number(),
        });
        const parsed = reportSchema.safeParse(resp);
        if (!parsed.success) {
          logger.error('Failed to parse ad report %o', resp);
          return new AError('Failed to parse facebook ad report');
        }
        const item = {
          percent: parsed.data.async_percent_completion,
          status: parsed.data.async_status,
        };
        if (item.status === 'Job Failed') {
          logger.error('Ad report failed %o', resp);
        }
        if (item.status === 'Job Completed') {
          await this.getAndSaveAdsAndInsights(reportId, integration, adExternalIdMap, dbAccount);
        }
        status.push(item);
      }

      if (status.every((s) => s.status === 'Job Completed')) {
        userId &&
          pubSub.publish('user:channel:initial-progress', userId, {
            channel: IntegrationTypeEnum.FACEBOOK,
            progress: 100,
          });
        break;
      }

      const mean = (0.95 * status.reduce((acc, val) => acc + val.percent, 0)) / status.length;
      userId &&
        pubSub.publish('user:channel:initial-progress', userId, {
          channel: IntegrationTypeEnum.FACEBOOK,
          progress: mean + 5,
        });

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
        device: Facebook.deviceEnumMap.get(insight.device_platform) ?? DeviceEnum.Unknown,
        publisher: Facebook.publisherEnumMap.get(insight.publisher_platform) ?? PublisherEnum.Unknown,
        position: insight.platform_position,
      },
      ad: {
        externalAdAccountId: insight.account_id,
        externalId: insight.ad_id,
        name: insight.ad_name,
      },
    });

    logger.info('Getting insights for report %s', reportId);

    const report = new AdReportRun(reportId, { report_run_id: reportId });
    const resp = await report.getInsights(
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
    const insightsProcessFn = async (i: { insight: ChannelInsight; ad: ChannelAd }[]) => {
      await this.saveAdsAndInsights(i, adExternalIdMap, integration, dbAccount);
      return undefined;
    };
    const accountInsightsAndAds = await Facebook.handlePaginationFn(
      resp,
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
  ) {
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
    cursor: Cursor,
    schema: U,
    parseCallback: (result: z.infer<U>) => T,
  ): Promise<AError | T[]> {
    const arraySchema = z.array(schema);
    const parsed = arraySchema.safeParse(cursor);
    if (!parsed.success) {
      logger.error('Failed to parse %o', cursor);
      return new AError('Failed to parse facebook paginated response');
    }
    const results = parsed.data.map(parseCallback);
    while (cursor.hasNext()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
      const next = await cursor.next();
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
    cursor: Cursor,
    schema: U,
    parseCallback: (result: z.infer<U>) => T,
    processCallback: (result: T[]) => Promise<V[] | undefined> | V[] | undefined,
  ): Promise<AError | V[] | undefined> {
    const arraySchema = z.array(schema);
    const parsed = arraySchema.safeParse(cursor);
    if (!parsed.success) {
      logger.error('Failed to parse %o', cursor);
      return new AError('Failed to parse facebook paginated response');
    }
    const results = await processCallback(parsed.data.map(parseCallback));
    while (cursor.hasNext()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
      const next = await cursor.next();
      const parsedNext = arraySchema.safeParse(next);
      if (parsedNext.success) {
        const processed = await processCallback(parsedNext.data.map(parseCallback));
        if (results && processed) results.push(...processed);
      } else {
        logger.error('Failed to parse paginated %o', next);
      }
    }
    return results;
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
    if (isAError(debugToken)) return debugToken;
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

export const facebook = new Facebook();
