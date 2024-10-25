import { type AError } from '@repo/utils';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import {
  type AdAccount,
  type CurrencyEnum,
  type DeviceEnum,
  type Integration,
  type IntegrationTypeEnum,
  type PublisherEnum,
} from '@repo/database';
import { type MetaError } from './errors';
import { type ChannelIFrame } from './iframe-helper';
import { type JobStatusEnum } from './report-async-start';
import { type AdAccountIntegration, type AdWithAdAccount } from './insights-utils';

export interface GenerateAuthUrlResp {
  url: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt?: Date;
  externalId?: string;
}

export interface ChannelAdAccount {
  name: string;
  currency: CurrencyEnum;
  externalId: string;
}

export interface ChannelAd {
  externalAdSetId: string;
  externalAdAccountId: string;
  externalId: string;
  name?: string;
}

export interface ChannelAdSet {
  externalCampaignId: string;
  externalId: string;
  name: string;
}

export interface ChannelCampaign {
  externalAdAccountId: string;
  externalId: string;
  name: string;
}

export interface ChannelCreative {
  externalAdId: string;
  externalId: string;
  name: string;
  body?: string;
  title?: string;
  status?: string;
  callToActionType?: string;
  imageUrl?: string;
}

export interface ChannelInsight {
  clicks: number;
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
  deAuthorize: (organizationId: string) => Promise<string | AError | MetaError>;
  exchangeCodeForTokens: (code: string) => Promise<TokensResponse | AError>;
  generateAuthUrl: (state: string) => GenerateAuthUrlResp;
  getAdPreview: (
    integration: Integration,
    adId: string,
    publisher?: PublisherEnum,
    device?: DeviceEnum,
    position?: string,
  ) => Promise<ChannelIFrame | AError>;
  getAdAccountData: (integration: Integration, adAccount: AdAccount, initial: boolean) => Promise<AError | undefined>;
  getDefaultPublisher: () => PublisherEnum;
  getReportStatus: (adAccount: AdAccountIntegration, taskId: string) => Promise<JobStatusEnum>;
  getUserId: (accessToken: string) => Promise<string | AError>;
  processReport: (
    adAccount: AdAccountIntegration,
    taskId: string,
    since: Date,
    until: Date,
  ) => Promise<AError | undefined>;
  refreshAccessToken: (integration: Integration) => Promise<Integration | AError>;
  runAdInsightReport: (
    adAccount: AdAccount,
    integration: Integration,
    since: Date,
    until: Date,
  ) => Promise<string | AError>;
  saveAdAccounts: (integration: Integration) => Promise<AdAccount[] | AError>;
  saveCreatives: (integration: Integration, groupByAdAccount: Map<string, AdWithAdAccount[]>) => Promise<void>;
  signOutCallback: (req: ExpressRequest, res: ExpressResponse) => void;
  getType: () => IntegrationTypeEnum;
}
