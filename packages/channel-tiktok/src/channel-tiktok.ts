import { URLSearchParams } from 'node:url';
import { Readable } from 'node:stream';
import {
  type AdAccount,
  CurrencyEnum,
  DeviceEnum,
  type Integration,
  IntegrationTypeEnum,
  prisma,
  PublisherEnum,
} from '@repo/database';
import { AError, formatYYYMMDDDate, isAError } from '@repo/utils';
import { type Writeable, z, type ZodEnum } from 'zod';
import { logger } from '@repo/logger';
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
  saveAccounts,
  saveAds,
  saveInsights,
  timeRange,
  type TokensResponse,
} from '@repo/channel-utils';
import csvParser from 'csv-parser';
import _ from 'lodash';
import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';
import { env } from './config';

const apiVersion = 'v1.3';
export const baseUrl = `https://business-api.tiktok.com/open_api/${apiVersion}`;

const apiBaseValidationSchema = z.object({
  code: z.number().int(),
  message: z.string(),
  request_id: z.string(),
  data: z.unknown().optional(),
});
type ApiBaseValidationSchema = z.infer<typeof apiBaseValidationSchema>;

enum PlacementsEnum {
  TikTok = 'TikTok',
  GlobalAppBundle = 'Global App Bundle',
  Pangle = 'Pangle',
}

const insightsSchema = z.array(
  z.object({
    '﻿Ad ID': z.string(),
    'Ad Name': z.string(),
    Placements: z.nativeEnum(PlacementsEnum),
    Date: z.coerce.date(),
    'Placements Types': z.string(),
    Impression: z.coerce.number().int(),
    Cost: z.coerce.number(),
  }),
);

export const reportRequestInput = z.object({
  initial: z.boolean(),
  accessToken: z.string(),
  accountId: z.string(),
  accountExternalId: z.string(),
  channel: z.nativeEnum(IntegrationTypeEnum),
});

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export class Tiktok implements ChannelInterface {
  generateAuthUrl(state: string): GenerateAuthUrlResp {
    const params = new URLSearchParams({
      app_id: env.TIKTOK_APPLICATION_ID,
      redirect_uri: `${env.API_ENDPOINT}${authEndpoint}`,
      state,
    });

    return {
      url: `https://business-api.tiktok.com/portal/auth?${params.toString()}`,
    };
  }

  async exchangeCodeForTokens(code: string): Promise<TokensResponse | AError> {
    const response = await Tiktok.tikTokFetch('', `${baseUrl}/oauth2/access_token/`, {
      method: 'POST',
      body: JSON.stringify({
        app_id: env.TIKTOK_APPLICATION_ID,
        secret: env.TIKTOK_APPLICATION_SECRET,
        auth_code: code,
      }),
    });

    const data = await Tiktok.baseValidation(response);
    if (isAError(data)) return data;
    const schema = z.object({ access_token: z.string().min(2) });
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return new AError('Failed to parse token response');
    }

    return {
      accessToken: parsed.data.access_token,
      accessTokenExpiresAt: null,
    };
  }

  async getUserId(accessToken: string): Promise<string | AError> {
    const response = await Tiktok.tikTokFetch(accessToken, `${baseUrl}/user/info/`);
    const data = await Tiktok.baseValidation(response);
    if (isAError(data)) return data;
    const schema = z.object({ core_user_id: z.string() });
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return new AError('Failed to fetch user');
    }
    return parsed.data.core_user_id;
  }

  signOutCallback(_req: ExpressRequest, res: ExpressResponse): void {
    logger.error(`Tik-Tok does not support a signout callback`);
    res.status(200).send('OK');
  }

  async deAuthorize(organizationId: string): Promise<string | AError> {
    const integration = await getConnectedIntegrationByOrg(organizationId, IntegrationTypeEnum.TIKTOK);
    if (!integration) return new AError('No integration found');
    if (isAError(integration)) return integration;

    const response = await Tiktok.tikTokFetch(integration.accessToken, `${baseUrl}/oauth2/revoke_token/`, {
      method: 'POST',
      body: JSON.stringify({
        app_id: env.TIKTOK_APPLICATION_ID,
        secret: env.TIKTOK_APPLICATION_SECRET,
        access_token: integration.accessToken,
      }),
    }).catch((error: unknown) => {
      logger.error('Failed to de-authorize %o', { error });
      return error instanceof Error ? error : new Error(JSON.stringify(error));
    });

    const data = await Tiktok.baseValidationWithOuter(response);
    if (isAError(data)) return data;
    if (data.code !== 0 && data.code !== 40000) {
      logger.error(data.message, 'Failed to de-authorize');
      return new AError('Failed to de-authorize');
    }
    return integration.externalId;
  }

  async saveAdAccounts(integration: Integration): Promise<AdAccount[] | AError> {
    const params = new URLSearchParams({
      app_id: env.TIKTOK_APPLICATION_ID,
      secret: env.TIKTOK_APPLICATION_SECRET,
    });
    const response = await Tiktok.tikTokFetch(
      integration.accessToken,
      `${baseUrl}/oauth2/advertiser/get?${params.toString()}`,
    );
    const data = await Tiktok.baseValidation(response);
    if (isAError(data)) return data;
    const schema = z.object({ list: z.array(z.object({ advertiser_id: z.string(), advertiser_name: z.string() })) });
    const parsed = schema.safeParse(data);
    if (!parsed.success) return new AError('Failed to fetch user');

    const activeAccounts = await Tiktok.getActiveAccounts(
      integration,
      parsed.data.list.map((account) => account.advertiser_id),
    );
    if (isAError(activeAccounts)) return activeAccounts;

    return await saveAccounts(activeAccounts, integration);
  }

  async getChannelData(integration: Integration, initial: boolean): Promise<AError | undefined> {
    const dbAccounts = await this.saveAdAccounts(integration);
    if (isAError(dbAccounts)) return dbAccounts;
    await Tiktok.runAdInsightReports(dbAccounts, integration, initial);
    return undefined;
  }

  async getAdPreview(
    integration: Integration,
    adId: string,
    _publisher: PublisherEnum | undefined,
    _device: DeviceEnum | undefined,
    _position: string | undefined,
  ): Promise<ChannelIFrame | AError> {
    const ad = await prisma.ad.findUniqueOrThrow({ include: { adAccount: true }, where: { id: adId } });
    const response = await Tiktok.tikTokFetch(integration.accessToken, `${baseUrl}/creative/ads_preview/create`, {
      method: 'POST',
      body: JSON.stringify({
        advertiser_id: ad.adAccount.externalId,
        preview_type: 'AD',
        ad_id: ad.externalId,
      }),
    });
    const data = await Tiktok.baseValidation(response);
    if (isAError(data)) return data;
    const schema = z.object({ preview_link: z.string() });
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      logger.error(parsed.error, 'Failed to get ad preview');
      return new AError('Failed to get ad preview');
    }
    return {
      src: parsed.data.preview_link,
      width: 261,
      height: 561,
    };
  }

  getDefaultPublisher(): PublisherEnum {
    return PublisherEnum.TikTok;
  }

  private static async getActiveAccounts(
    integration: Integration,
    advertiserIds: string[],
  ): Promise<ChannelAdAccount[] | AError> {
    const response = await Tiktok.tikTokFetch(
      integration.accessToken,
      `${baseUrl}/advertiser/info?advertiser_ids=["${advertiserIds.join('","')}"]&fields=["status","currency","name","advertiser_id"]`,
    );
    const data = await Tiktok.baseValidation(response);
    if (isAError(data)) return data;
    const schema = z.object({
      list: z.array(
        z.object({
          advertiser_id: z.string(),
          name: z.string(),
          currency: z.nativeEnum(CurrencyEnum),
          status: z.string(),
        }),
      ),
    });
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      logger.error(parsed.error, `Failed to get active accounts for ${integration.id}`);
      return new AError('Failed to save accounts');
    }
    return parsed.data.list
      .filter((account) => account.status === 'STATUS_ENABLE')
      .map((account) => ({
        externalId: account.advertiser_id,
        name: account.name,
        currency: account.currency,
      }));
  }

  private static tikTokFetch = async (
    accessToken: string,
    input: string | URL | globalThis.Request,
    init?: RequestInit,
  ): Promise<Response | AError> => {
    const initWHeaders = {
      ...init,
      headers: {
        'Access-Token': accessToken,
        ...(init?.method === 'POST' && { 'Content-Type': 'application/json' }),
      },
    };
    const response = await fetch(input, initWHeaders).catch((error: unknown) => {
      logger.error(error, 'Failed to execute tik-tok request');
      return error instanceof Error ? error : new AError(JSON.stringify(error));
    });
    if (response instanceof Error) {
      logger.error(response, 'Failed execute tik-tok request');
      return response;
    }
    if (!response.ok) {
      logger.error(await response.text(), 'Failed to execute tik-tok request');
      return new AError('Unknown error');
    }
    return response;
  };

  private static baseValidation = async (response: Response | Error): Promise<unknown> => {
    const data = await Tiktok.baseValidationWithOuter(response);
    if (isAError(data)) return response;
    if (data.code !== 0) {
      logger.error(data.message, 'Failed to parse base tik-tok response');
      return new AError(data.message);
    }
    if (!data.data) {
      logger.error('No data in response');
      return new AError('No data in response');
    }
    return data.data;
  };

  private static baseValidationWithOuter = async (
    response: Response | Error,
  ): Promise<AError | ApiBaseValidationSchema> => {
    if (response instanceof Error) return response;
    const contentType = response.headers.get('content-type');
    if (!contentType) return new AError('No content type');
    switch (contentType) {
      case 'application/json': {
        const parsed = apiBaseValidationSchema.safeParse(await response.json());
        if (!parsed.success) {
          logger.error(parsed.error, 'Failed to parse base tik-tok response');
          return new AError('Failed to parse response');
        }
        return parsed.data;
      }
      default:
        logger.error(contentType, 'Failed to parse base tik-tok response');
        return new AError('Failed to parse response');
    }
  };

  private static csvParseAndProcess = async (
    response: Response,
    processFn: (data: unknown[]) => Promise<AError | undefined>,
  ): Promise<AError[] | undefined> => {
    const tasks: Promise<undefined | AError>[] = [];
    let batch: unknown[] = [];
    let lineCounter = 0;

    await new Promise<AError | undefined>((resolve, reject) => {
      if (!response.body) {
        reject(new AError('No body in response'));
        return;
      }

      const reader = response.body.getReader();
      const stream = new Readable({
        read() {
          reader
            .read()
            .then(({ done, value }) => {
              logger.info({ done, length: value?.length }, 'TikTok report reading status');
              if (done) {
                this.push(null);
              } else {
                this.push(Buffer.from(value));
              }
            })
            .catch((err: unknown) => {
              this.emit('error', err);
            });
        },
      });

      stream
        .pipe(csvParser())
        .on('data', (row) => {
          batch.push(row);
          lineCounter++;
          if (lineCounter === 500) {
            tasks.push(processFn([...batch]));
            batch = [];
            lineCounter = 0;
          }
        })
        .on('end', () => {
          if (batch.length > 0) {
            tasks.push(processFn([...batch]));
          }
          resolve(undefined);
        })
        .on('error', (error) => {
          logger.error(error, 'Failed to parse CSV data');
          reject(new AError('Failed to parse CSV data'));
        });
    });
    return await Promise.all(tasks).then((results) => results.flatMap((result) => (result ? [result] : [])));
  };

  /**
   * Run reports for each account
   * @returns Map of task id to Ad account
   */
  private static runAdInsightReports = async (
    dbAccounts: AdAccount[],
    integration: Integration,
    initial: boolean,
  ): Promise<void> => {
    await sqsClient.send(
      new SendMessageBatchCommand({
        QueueUrl: env.TIKTOK_REPORT_REQUESTS_QUEUE_URL,
        Entries: dbAccounts.map((account) => ({
          Id: account.id,
          MessageBody: JSON.stringify({
            channel: IntegrationTypeEnum.TIKTOK,
            initial,
            accessToken: integration.accessToken,
            accountId: account.id,
            accountExternalId: account.externalId,
          } satisfies z.infer<typeof reportRequestInput>),
        })),
      }),
    );
  };

  public static runAdInsightReport = async ({
    initial,
    accountId,
    accessToken,
    accountExternalId,
  }: z.infer<typeof reportRequestInput>): Promise<string | AError> => {
    const tikTokTimeRange = await Tiktok.timeRange(initial, accountId);
    const response = await Tiktok.tikTokFetch(accessToken, `${baseUrl}/report/task/create`, {
      method: 'POST',
      body: JSON.stringify({
        ...tikTokTimeRange,
        advertiser_id: accountExternalId,
        data_level: 'AUCTION_AD',
        dimensions: ['ad_id', 'placement', 'stat_time_day'],
        report_type: 'AUDIENCE',
        metrics: ['ad_name', 'ad_id', 'placement_type', 'impressions', 'spend'],
      }),
    });
    const data = await Tiktok.baseValidation(response);
    if (isAError(data)) return data;
    const schema = z.object({ task_id: z.string() });
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      logger.error(parsed.error, 'Failed to create task');
      return new AError(parsed.error.message);
    }
    return parsed.data.task_id;
  };

  private static timeRange = async (
    initial: boolean,
    adAccountId: string,
  ): Promise<{ start_date: string; end_date: string }> => {
    const range = await timeRange(initial, adAccountId);
    return {
      start_date: formatYYYMMDDDate(range.since),
      end_date: formatYYYMMDDDate(range.until),
    };
  };

  /**
   * Wait for reports to be processed and process them
   * @param taskIdAdAccount - Map of task id to Ad account
   * @param integration - Integration
   * @param initial - If this is the first time the data is being fetched
   */
  private static waitAndProcessReports = async (
    taskIdAdAccount: Map<string, AdAccount>,
    integration: Integration,
    initial: boolean,
  ): Promise<(AError | undefined)[]> => {
    const processingTasks: Promise<AError | undefined>[] = [];
    const jobStatusEnum = z.enum(['QUEUING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELED']);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition -- Uses break
    while (true) {
      const statuses = await this.getProcessStatus(taskIdAdAccount, integration, jobStatusEnum);

      // Filter out tasks based on their status and log if necessary
      for (const [taskId, adAccount] of taskIdAdAccount) {
        const taskStatus = statuses.find((status) => status.taskId === taskId);
        if (!taskStatus) {
          taskIdAdAccount.delete(taskId);
          continue;
        }

        switch (taskStatus.status) {
          case jobStatusEnum.enum.SUCCESS:
            processingTasks.push(Tiktok.processReport(taskId, integration, adAccount, initial));
            taskIdAdAccount.delete(taskId);
            continue;
          case jobStatusEnum.enum.FAILED:
            logger.warn(`Task ${taskId} failed`);
            taskIdAdAccount.delete(taskId);
            continue;
          case jobStatusEnum.enum.CANCELED:
            logger.error(`Task ${taskId} was canceled`);
            taskIdAdAccount.delete(taskId);
            continue;
          default:
            break;
        }
      }

      if (taskIdAdAccount.size === 0) break;

      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }

    return await Promise.all(processingTasks);
  };

  public static getProcessStatus = async (
    taskIdAdAccount: Map<string, AdAccount>,
    integration: Integration,
    jobStatusEnum: ZodEnum<Writeable<[string, string, string, string, string]>>,
  ): Promise<{ taskId: string; status: string }[]> => {
    return await Promise.all(
      Array.from(taskIdAdAccount.keys()).map(async (taskId) => {
        const params = new URLSearchParams({
          advertiser_id: integration.externalId,
          task_id: taskId,
        });
        const response = await Tiktok.tikTokFetch(
          integration.accessToken,
          `${baseUrl}/report/task/check?${params.toString()}`,
        );
        const data = await Tiktok.baseValidation(response);
        if (isAError(data)) {
          logger.error(data, `Failed to get status for task ${taskId} and integration ${integration.id}`);
          return { taskId, status: 'ERROR' };
        }
        const schema = z.object({ status: jobStatusEnum });
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
          logger.error(parsed.error, `Failed to get status for task ${taskId} and integration ${integration.id}`);
          return { taskId, status: 'ERROR' };
        }
        return { taskId, status: parsed.data.status };
      }),
    );
  };

  private static processReport = async (
    taskId: string,
    integration: Integration,
    adAccount: AdAccount,
    initial: boolean,
  ): Promise<AError | undefined> => {
    const params = new URLSearchParams({
      advertiser_id: integration.externalId,
      task_id: taskId,
    });
    const response = await Tiktok.tikTokFetch(
      integration.accessToken,
      `${baseUrl}/report/task/download?${params.toString()}`,
    );

    const placementPublisherMap = new Map<PlacementsEnum, PublisherEnum>([
      [PlacementsEnum.TikTok, PublisherEnum.TikTok],
      [PlacementsEnum.GlobalAppBundle, PublisherEnum.GlobalAppBundle],
      [PlacementsEnum.Pangle, PublisherEnum.Pangle],
    ]);

    const fn = (data: unknown[]): Promise<AError | undefined> =>
      Tiktok.processReportChunk(taskId, integration, adAccount, data, placementPublisherMap, new Map(), new Map());
    if (isAError(response)) return response;
    await deleteOldInsights(adAccount.id, initial);
    const processed = await Tiktok.csvParseAndProcess(response, fn);
    if (processed) return processed[0];
    return undefined;
  };

  private static processReportChunk = async (
    taskId: string,
    integration: Integration,
    adAccount: AdAccount,
    data: unknown[],
    placementPublisherMap: Map<PlacementsEnum, PublisherEnum>,
    adsMap: Map<string, ChannelAd>,
    adExternalIdMap: Map<string, string>,
  ): Promise<AError | undefined> => {
    const parsed = insightsSchema.safeParse(data);
    if (!parsed.success) {
      logger.error(parsed.error, `Failed to parse report for task ${taskId} and integration ${integration.id}`);
      return new AError('Failed to parse report');
    }

    const insights: ChannelInsight[] = [];
    parsed.data.forEach((row) => {
      const insight: ChannelInsight = {
        externalAdId: row['﻿Ad ID'],
        date: row.Date,
        externalAccountId: adAccount.externalId,
        impressions: row.Impression,
        spend: Math.floor(row.Cost * 100),
        device: DeviceEnum.Unknown,
        publisher: placementPublisherMap.get(row.Placements) ?? PublisherEnum.TikTok,
        position: row['Placements Types'],
      };
      insights.push(insight);
      adsMap.set(insight.externalAdId, {
        externalAdAccountId: adAccount.externalId,
        externalId: insight.externalAdId,
        name: row['Ad Name'],
      });
    });
    const ads = Array.from(adsMap.values());
    const uniqueAds = _.uniqBy(ads, (ad) => ad.externalId);
    const newAds = uniqueAds.filter((ad) => !adExternalIdMap.has(ad.externalId));
    await saveAds(integration, newAds, adAccount.id, adExternalIdMap);
    await saveInsights(insights, adExternalIdMap, adAccount);
  };
}

export const tiktok = new Tiktok();
