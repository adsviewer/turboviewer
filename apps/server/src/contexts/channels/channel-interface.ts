import { type AError } from '@repo/utils';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { type FbError } from './fb/fb-channel';

export interface GenerateAuthUrlResp {
  url: string;
  state: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt?: Date;
  externalId?: string;
}

export interface ChannelInterface {
  generateAuthUrl: () => GenerateAuthUrlResp;
  exchangeCodeForTokens: (code: string) => Promise<TokensResponse | AError>;
  getUserId: (accessToken: string) => Promise<string | AError>;
  signOutCallback: (req: ExpressRequest, res: ExpressResponse) => void;
  deAuthorize: (organizationId: string) => Promise<string | AError | FbError>;
}
