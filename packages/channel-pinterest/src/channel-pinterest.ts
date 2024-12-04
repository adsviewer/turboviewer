import {
  type AdAccount as DbAdAccount,
  DeviceEnum,
  type Integration,
  IntegrationTypeEnum,
  PublisherEnum,
  IntegrationStatus,
} from '@repo/database';
import { AError, FireAndForget, isAError } from '@repo/utils';
import { z, type ZodSchema, type ZodTypeAny } from 'zod';
import { logger } from '@repo/logger';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import {
  type AdAccountIntegration,
  authEndpoint,
  type ChannelIFrame,
  type ChannelInterface,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  type JobStatusEnum,
  markStatusIntegrationById,
  parseRequest,
  revokeIntegration,
  type TokensResponse,
} from '@repo/channel-utils';
import { env } from './config';

const fireAndForget = new FireAndForget();

const apiVersion = 'v5';

const baseUrl = `https://api.pinterest.com/${apiVersion}`;

interface GenericResponse<T> {
  requestId?: string;
  queryResourceConsumption?: string;
  results?: T[];
  fieldMask?: string;
  nextPageToken?: string;
}

const tokenHasBeenExpiredOrRevoked = 'Token has been expired or revoked.';

class Pinterest implements ChannelInterface {
  generateAuthUrl(state: string): GenerateAuthUrlResp {
    const clientId = env.PINTEREST_APP_ID;
    const redirectUri = `${env.API_ENDPOINT}${authEndpoint}`;
    const scopes = ['ads:read'];

    const url = `https://www.pinterest.com/oauth/?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(',')}&state=${state}`;

    return { url };
  }

  async exchangeCodeForTokens(code: string): Promise<TokensResponse | AError> {
    const clientId = env.PINTEREST_APP_ID;
    const clientSecret = env.PINTEREST_APP_SECRET;
    const redirectUri = `${env.API_ENDPOINT}${authEndpoint}`;

    const response = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokens: unknown = await response.json();

    const requestSchema = z.object({
      response_type: z.string(),
      access_token: z.string(),
      token_type: z.string(),
      expires_in: z.number().int(),
      scope: z.string(),
      refresh_token: z.string(),
      refresh_token_expires_in: z.number().int(),
    });

    const parsed = requestSchema.safeParse(tokens);
    if (!parsed.success) {
      logger.error(parsed.error, 'Failed to parse Pinterest token response');
      return new AError('Failed to fetch user');
    }

    return {
      accessToken: parsed.data.access_token,
      refreshToken: parsed.data.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + parsed.data.expires_in * 1000),
    };
  }

  async getUserId(_accessToken: string): Promise<string | AError> {
    return Promise.reject(new AError('Not Implemented'));
  }

  signOutCallback(req: ExpressRequest, res: ExpressResponse): void {
    logger.info(`sign out callback body ${JSON.stringify(req.body)}`);

    const parsedBody = z.object({ signed_request: z.string() }).safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).send('Failed to parse sign out request');
      return;
    }
    const userId = parseRequest(parsedBody.data.signed_request, env.PINTEREST_APP_SECRET);
    if (isAError(userId)) {
      logger.error(userId.message);
      res.status(400).send(userId.message);
      return;
    }
    fireAndForget.add(() => revokeIntegration(userId, IntegrationTypeEnum.PINTEREST));
    res.status(200).send('OK');
  }

  async deAuthorize(organizationId: string): Promise<string | AError> {
    const integration = await getConnectedIntegrationByOrg(organizationId, IntegrationTypeEnum.PINTEREST);
    if (!integration) return new AError('No integration found');
    if (isAError(integration)) return integration;

    const refreshedIntegration = await Pinterest.refreshedIntegration(integration);
    if (isAError(refreshedIntegration)) {
      if (refreshedIntegration.message === tokenHasBeenExpiredOrRevoked) return integration.externalId;
      return refreshedIntegration;
    }

    const revokeUrl = `https://pinterst/revoke?token=${refreshedIntegration.accessToken}`;

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

  async refreshAccessToken(_integration: Integration): Promise<Integration | AError> {
    return Promise.reject(new AError('Not Implemented'));
  }

  private static async refreshedIntegration(_integration: Integration): Promise<Integration | AError> {
    return Promise.reject(new AError('Not Implemented'));
  }

  async getAdAccountData(
    _integration: Integration,
    _dbAccount: DbAdAccount,
    _initial: boolean,
  ): Promise<AError | undefined> {
    return Promise.resolve(undefined);
  }

  async getAdPreview(
    _integration: Integration,
    _adId: string,
    _publisher?: PublisherEnum,
    _device?: DeviceEnum,
    _position?: string,
  ): Promise<ChannelIFrame | AError> {
    return Promise.reject(new AError('Not Implemented'));
  }

  getDefaultPublisher(): PublisherEnum {
    return PublisherEnum.Unknown;
  }

  async saveAdAccounts(_integration: Integration): Promise<DbAdAccount[] | AError> {
    return Promise.reject(new AError('Not Implemented'));
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
    _integration: Integration,
    _query: string,
    _schema: ZodSchema<GenericResponse<T>>,
    _customerId?: string,
    _parseCallback?: (result: z.infer<U>) => T,
  ): Promise<AError | GenericResponse<T>['results']> {
    return Promise.reject(new AError('Not Implemented'));
  }

  private static deviceEnumMap: Map<string, DeviceEnum> = new Map<string, DeviceEnum>([
    ['MOBILE_APP', DeviceEnum.MobileApp],
    ['MOBILE_WEB', DeviceEnum.MobileWeb],
    ['DESKTOP_WEB', DeviceEnum.Desktop],
  ]);

  getType(): IntegrationTypeEnum {
    return IntegrationTypeEnum.PINTEREST;
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

export const pinterest = new Pinterest();
