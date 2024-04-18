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

export interface DbAdAccount {
  accountStatus: number;
  // in cents
  amountSpent: number;
  hasAdsRunningOrInReview: boolean;
  id: string;
}

export interface Creative {
  externalAdId: string;
  externalId: string;
  name: string;
}

export interface Insight {
  externalAdId: string;
  date: Date;
  externalAccountId: string;
  impressions: number;
  // in μ (micro) currency
  spend: number;
  device: string;
  publisher: string;
  position: string;
}

export interface ChannelInterface {
  generateAuthUrl: () => GenerateAuthUrlResp;
  exchangeCodeForTokens: (code: string) => Promise<TokensResponse | AError>;
  getUserId: (accessToken: string) => Promise<string | AError>;
  signOutCallback: (req: ExpressRequest, res: ExpressResponse) => void;
  deAuthorize: (organizationId: string) => Promise<string | AError | FbError>;
  adIngress: (organizationId: string, userId: string) => Promise<undefined | AError>;
}
