import { createHmac, randomUUID } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import { IntegrationTypeEnum } from '@repo/database';
import { AError, isAError } from '@repo/utils';
import { z } from 'zod';
import { logger } from '@repo/logger';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import { env, MODE } from '../../../config';
import { type ChannelInterface, type TokensResponse } from '../channel-interface';
import { FireAndForget } from '../../../fire-and-forget';
import { revokeIntegration } from '../integration-util';

const fireAndForget = new FireAndForget();

const apiVersion = `v19.0`;
export const baseOauthFbUrl = `https://www.facebook.com/${apiVersion}`;
export const baseGraphFbUrl = `https://graph.facebook.com/${apiVersion}`;

class Facebook implements ChannelInterface {
  generateAuthUrl() {
    const state = `${MODE}_${IntegrationTypeEnum.FACEBOOK}_${randomUUID()}`;
    const scopes = ['ads_read', 'catalog_management'];

    const params = new URLSearchParams({
      client_id: env.FB_APPLICATION_ID,
      scope: scopes.join(','),
      redirect_uri: `${env.API_ENDPOINT}/channel/auth`,
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
      redirect_uri: `${env.API_ENDPOINT}/channel/auth`,
      code,
    });

    const response: Response | AError = await fetch(`${baseGraphFbUrl}/oauth/access_token?${params.toString()}`).catch(
      (error: unknown) => {
        logger.error('Failed to exchange code for tokens %o', { error });
        return error instanceof Error ? error : new Error(JSON.stringify(error));
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
      expires_in: z.number(),
    });
    const parsed = tokenSchema.safeParse(body);
    if (!parsed.success) {
      return {
        name: 'FacebookError',
        message: 'Failed to parse token response',
      };
    }

    return {
      accessToken: parsed.data.access_token,
      accessTokenExpiresAt: new Date(Date.now() + parsed.data.expires_in * 1000),
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
    const userId = facebook.parseRequest(parsedBody.data.signed_request, env.FB_APPLICATION_SECRET);
    if (isAError(userId)) {
      logger.error(userId.message);
      res.status(400).send(userId.message);
      return;
    }
    fireAndForget.add(() => revokeIntegration(userId, IntegrationTypeEnum.FACEBOOK));
    res.status(200).send('OK');
  }

  private parseRequest(signedRequest: string, secret: string): string | AError {
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
}

export const facebook = new Facebook();
