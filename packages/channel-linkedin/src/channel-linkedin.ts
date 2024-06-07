import { DeviceEnum, type Integration, IntegrationTypeEnum, PublisherEnum } from '@repo/database';
import { addInterval, AError } from '@repo/utils';
import { z } from 'zod';
import { logger } from '@repo/logger';
import { AuthClient, RestliClient } from 'linkedin-api-client';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import {
  authEndpoint,
  type ChannelInterface,
  type GenerateAuthUrlResp,
  getConnectedIntegrationByOrg,
  revokeIntegrationById,
  type TokensResponse,
} from '@repo/channel-utils';
import { env } from './config';

const authClient = new AuthClient({
  clientId: env.LINKEDIN_APPLICATION_ID,
  clientSecret: env.LINKEDIN_APPLICATION_SECRET,
  redirectUrl: `${env.API_ENDPOINT}${authEndpoint}`,
});

const restliClient = new RestliClient();

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

  async getChannelData(_integration: Integration, _initial: boolean): Promise<AError | undefined> {
    return Promise.resolve(undefined);
  }

  getAdPreview(
    _integration: Integration,
    _adId: string,
    _publisher?: PublisherEnum,
    _device?: DeviceEnum,
    _position?: string,
  ): Promise<string | AError> {
    throw new Error('Not implemeted yet');
  }

  getDefaultPublisher(): PublisherEnum {
    return PublisherEnum.Facebook;
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

export const linkedIn = new LinkedIn();
