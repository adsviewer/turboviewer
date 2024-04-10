import { randomUUID } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import { IntegrationTypeEnum } from '@repo/database';
import { type AError } from '@repo/utils';
import { z } from 'zod';
import { env, MODE } from '../../../config';
import { type ChannelInterface, type TokensResponse } from '../channel-interface';

const apiVersion = `v19.0`;

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
      url: decodeURIComponent(`https://www.facebook.com/${apiVersion}/dialog/oauth?${params.toString()}`),
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

    const response = await fetch(`https://graph.facebook.com/${apiVersion}/oauth/access_token?${params.toString()}`);
    if (!response.ok) {
      return {
        name: 'FacebookError',
        message: 'Failed to exchange code for tokens',
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Will check with zod
    const body = await response.json();
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
}

export const facebook = new Facebook();
