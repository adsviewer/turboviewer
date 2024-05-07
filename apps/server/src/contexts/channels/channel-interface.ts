import { type AError } from '@repo/utils';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { type DeviceEnum, type PublisherEnum, type CurrencyEnum, type Integration } from '@repo/database';
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

export interface ChannelAdAccount {
  accountStatus: number;
  // in cents
  amountSpent: number;
  hasAdsRunningOrInReview: boolean;
  name: string;
  currency: CurrencyEnum;
  externalId: string;
}

export interface ChannelAd {
  externalAdAccountId: string;
  externalId: string;
  name: string;
}

export interface ChannelCreative {
  externalAdId: string;
  externalAdAccountId: string;
  externalId: string;
  name: string;
}

export interface ChannelInsight {
  externalAdId: string;
  date: Date;
  externalAccountId: string;
  impressions: number;
  // in cents
  spend: number;
  device: DeviceEnum;
  publisher: PublisherEnum;
  position: string;
}

export interface ChannelInterface {
  generateAuthUrl: () => GenerateAuthUrlResp;
  exchangeCodeForTokens: (code: string) => Promise<TokensResponse | AError>;
  getUserId: (accessToken: string) => Promise<string | AError>;
  signOutCallback: (req: ExpressRequest, res: ExpressResponse) => void;
  deAuthorize: (organizationId: string) => Promise<string | AError | FbError>;
  getChannelData: (
    integration: Integration,
    userId: string | undefined,
    initial: boolean,
  ) => Promise<{ accounts: ChannelAdAccount[]; insights: ChannelInsight[]; ads: ChannelAd[] } | AError>;
  getAdPreview: (
    integration: Integration,
    adId: string,
    publisher?: PublisherEnum,
    device?: DeviceEnum,
    position?: string,
  ) => Promise<string | AError>;
  getDefaultPublisher: () => PublisherEnum;
}
