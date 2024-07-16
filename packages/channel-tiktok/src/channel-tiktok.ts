import { URLSearchParams } from 'node:url';
import {
  type AdAccount,
  CurrencyEnum,
  type DeviceEnum,
  type Integration,
  IntegrationTypeEnum,
  PublisherEnum,
} from '@repo/database';
import { AError, isAError } from '@repo/utils';
import { z } from 'zod';
import { logger } from '@repo/logger';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import {
  authEndpoint,
  type ChannelAdAccount,
  type ChannelIFrame,
  type ChannelInterface,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  saveAccounts,
  type TokensResponse,
} from '@repo/channel-utils';
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

class Tiktok implements ChannelInterface {
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

  async getChannelData(_integration: Integration, _initial: boolean): Promise<AError | undefined> {
    return Promise.resolve(new AError('Not implemented'));
  }

  getAdPreview(
    _integration: Integration,
    _adId: string,
    _publisher: PublisherEnum | undefined,
    _device: DeviceEnum | undefined,
    _position: string | undefined,
  ): Promise<ChannelIFrame | AError> {
    return Promise.resolve(new AError('Not implemented'));
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
      return new AError('Uknown error');
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
    const parsed = apiBaseValidationSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.error(parsed.error, 'Failed to parse base tik-tok response');
      return new AError('Failed to parse response');
    }
    return parsed.data;
  };
}

export const tiktok = new Tiktok();
