import gql from 'graphql-tag';
import * as Urql from '@urql/next';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: bigint; output: bigint };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: Date; output: Date };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any };
};

export type Ad = {
  __typename: 'Ad';
  adAccount: AdAccount;
  adAccountId: Scalars['String']['output'];
  externalId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insights: AdInsightsConnection;
  name?: Maybe<Scalars['String']['output']>;
};

export type AdInsightsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  dateFrom?: InputMaybe<Scalars['Date']['input']>;
  dateTo?: InputMaybe<Scalars['Date']['input']>;
  devices?: InputMaybe<Array<DeviceEnum>>;
  first?: InputMaybe<Scalars['Int']['input']>;
  highestFirst?: InputMaybe<Scalars['Boolean']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InsightsColumnsOrderBy;
  positions?: InputMaybe<Array<Scalars['String']['input']>>;
  publishers?: InputMaybe<Array<PublisherEnum>>;
};

export type AdAccount = {
  __typename: 'AdAccount';
  adCount: Scalars['Int']['output'];
  advertisements: AdAccountAdvertisementsConnection;
  createdAt: Scalars['Date']['output'];
  currency: CurrencyEnum;
  externalId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insights: Array<Insight>;
  integration: Integration;
  integrationId: Scalars['String']['output'];
  /** Whether the ad account is connected to the current organization */
  isConnectedToCurrentOrg: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organizations: Array<Organization>;
  type: IntegrationType;
  updatedAt: Scalars['Date']['output'];
};

export type AdAccountAdvertisementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type AdAccountAdvertisementsConnection = {
  __typename: 'AdAccountAdvertisementsConnection';
  edges: Array<Maybe<AdAccountAdvertisementsConnectionEdge>>;
  pageInfo: PageInfo;
};

export type AdAccountAdvertisementsConnectionEdge = {
  __typename: 'AdAccountAdvertisementsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Ad;
};

export type AdInsightsConnection = {
  __typename: 'AdInsightsConnection';
  edges: Array<Maybe<AdInsightsConnectionEdge>>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdInsightsConnectionEdge = {
  __typename: 'AdInsightsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Insight;
};

export enum AllRoles {
  ADMIN = 'ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  ORG_OPERATOR = 'ORG_OPERATOR',
  ORG_MEMBER = 'ORG_MEMBER',
}

export type BaseError = Error & {
  __typename: 'BaseError';
  message: Scalars['String']['output'];
};

export type ChannelInitialProgressPayload = {
  __typename: 'ChannelInitialProgressPayload';
  channel: IntegrationType;
  progress: Scalars['Float']['output'];
};

export enum CurrencyEnum {
  AFN = 'AFN',
  ALL = 'ALL',
  DZD = 'DZD',
  USD = 'USD',
  EUR = 'EUR',
  AOA = 'AOA',
  XCD = 'XCD',
  ARS = 'ARS',
  AMD = 'AMD',
  AWG = 'AWG',
  AUD = 'AUD',
  AZN = 'AZN',
  BSD = 'BSD',
  BHD = 'BHD',
  BDT = 'BDT',
  BBD = 'BBD',
  BYN = 'BYN',
  BZD = 'BZD',
  XOF = 'XOF',
  BMD = 'BMD',
  BTN = 'BTN',
  INR = 'INR',
  BOB = 'BOB',
  BOV = 'BOV',
  BAM = 'BAM',
  BWP = 'BWP',
  NOK = 'NOK',
  BRL = 'BRL',
  BND = 'BND',
  BGN = 'BGN',
  BIF = 'BIF',
  CVE = 'CVE',
  KHR = 'KHR',
  XAF = 'XAF',
  CAD = 'CAD',
  KYD = 'KYD',
  CLF = 'CLF',
  CLP = 'CLP',
  CNY = 'CNY',
  COP = 'COP',
  COU = 'COU',
  KMF = 'KMF',
  CDF = 'CDF',
  NZD = 'NZD',
  CRC = 'CRC',
  CUC = 'CUC',
  CUP = 'CUP',
  ANG = 'ANG',
  CZK = 'CZK',
  DKK = 'DKK',
  DJF = 'DJF',
  DOP = 'DOP',
  EGP = 'EGP',
  SVC = 'SVC',
  ERN = 'ERN',
  ETB = 'ETB',
  FKP = 'FKP',
  FJD = 'FJD',
  XPF = 'XPF',
  GMD = 'GMD',
  GEL = 'GEL',
  GHS = 'GHS',
  GIP = 'GIP',
  GTQ = 'GTQ',
  GBP = 'GBP',
  GNF = 'GNF',
  GYD = 'GYD',
  HTG = 'HTG',
  HNL = 'HNL',
  HKD = 'HKD',
  HUF = 'HUF',
  ISK = 'ISK',
  IDR = 'IDR',
  XDR = 'XDR',
  IRR = 'IRR',
  IQD = 'IQD',
  ILS = 'ILS',
  JMD = 'JMD',
  JPY = 'JPY',
  JOD = 'JOD',
  KZT = 'KZT',
  KES = 'KES',
  KPW = 'KPW',
  KRW = 'KRW',
  KWD = 'KWD',
  KGS = 'KGS',
  LAK = 'LAK',
  LBP = 'LBP',
  LSL = 'LSL',
  ZAR = 'ZAR',
  LRD = 'LRD',
  LYD = 'LYD',
  CHF = 'CHF',
  MOP = 'MOP',
  MGA = 'MGA',
  MWK = 'MWK',
  MYR = 'MYR',
  MVR = 'MVR',
  MRU = 'MRU',
  MUR = 'MUR',
  XUA = 'XUA',
  MXN = 'MXN',
  MXV = 'MXV',
  MDL = 'MDL',
  MNT = 'MNT',
  MAD = 'MAD',
  MZN = 'MZN',
  MMK = 'MMK',
  NAD = 'NAD',
  NPR = 'NPR',
  NIO = 'NIO',
  NGN = 'NGN',
  OMR = 'OMR',
  PKR = 'PKR',
  PAB = 'PAB',
  PGK = 'PGK',
  PYG = 'PYG',
  PEN = 'PEN',
  PHP = 'PHP',
  PLN = 'PLN',
  QAR = 'QAR',
  MKD = 'MKD',
  RON = 'RON',
  RUB = 'RUB',
  RWF = 'RWF',
  SHP = 'SHP',
  WST = 'WST',
  STN = 'STN',
  SAR = 'SAR',
  RSD = 'RSD',
  SCR = 'SCR',
  SLE = 'SLE',
  SGD = 'SGD',
  XSU = 'XSU',
  SBD = 'SBD',
  SOS = 'SOS',
  SSP = 'SSP',
  LKR = 'LKR',
  SDG = 'SDG',
  SRD = 'SRD',
  SZL = 'SZL',
  SEK = 'SEK',
  CHE = 'CHE',
  CHW = 'CHW',
  SYP = 'SYP',
  TWD = 'TWD',
  TJS = 'TJS',
  TZS = 'TZS',
  THB = 'THB',
  TOP = 'TOP',
  TTD = 'TTD',
  TND = 'TND',
  TRY = 'TRY',
  TMT = 'TMT',
  UGX = 'UGX',
  UAH = 'UAH',
  AED = 'AED',
  USN = 'USN',
  UYI = 'UYI',
  UYU = 'UYU',
  UZS = 'UZS',
  VUV = 'VUV',
  VEF = 'VEF',
  VED = 'VED',
  VND = 'VND',
  YER = 'YER',
  ZMW = 'ZMW',
  ZWL = 'ZWL',
}

export enum DeviceEnum {
  MobileWeb = 'MobileWeb',
  MobileApp = 'MobileApp',
  Desktop = 'Desktop',
  Unknown = 'Unknown',
}

export type Error = {
  message: Scalars['String']['output'];
};

export type FilterInsightsInput = {
  adAccountIds?: InputMaybe<Array<Scalars['String']['input']>>;
  adIds?: InputMaybe<Array<Scalars['String']['input']>>;
  dataPointsPerInterval?: Scalars['Int']['input'];
  dateFrom?: InputMaybe<Scalars['Date']['input']>;
  dateTo?: InputMaybe<Scalars['Date']['input']>;
  devices?: InputMaybe<Array<DeviceEnum>>;
  groupBy?: InputMaybe<Array<InsightsColumnsGroupBy>>;
  interval: InsightsInterval;
  order?: InputMaybe<OrderBy>;
  orderBy?: InsightsColumnsOrderBy;
  /** Starting at 1 */
  page?: Scalars['Int']['input'];
  pageSize?: Scalars['Int']['input'];
  positions?: InputMaybe<Array<InsightsPosition>>;
  publishers?: InputMaybe<Array<PublisherEnum>>;
};

export type GenerateGoogleAuthUrlResponse = {
  __typename: 'GenerateGoogleAuthUrlResponse';
  type: LoginProviderEnum;
  url: Scalars['String']['output'];
};

export type GroupedInsight = Pagination & {
  __typename: 'GroupedInsight';
  edges: Array<GroupedInsights>;
  hasNext: Scalars['Boolean']['output'];
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type GroupedInsights = {
  __typename: 'GroupedInsights';
  adAccountId?: Maybe<Scalars['String']['output']>;
  adAccountName?: Maybe<Scalars['String']['output']>;
  adId?: Maybe<Scalars['String']['output']>;
  adName?: Maybe<Scalars['String']['output']>;
  currency: CurrencyEnum;
  datapoints: Array<InsightsDatapoints>;
  device?: Maybe<DeviceEnum>;
  iFrame?: Maybe<IFrame>;
  id: Scalars['String']['output'];
  position?: Maybe<Scalars['String']['output']>;
  publisher?: Maybe<PublisherEnum>;
};

export type IFrame = {
  __typename: 'IFrame';
  height: Scalars['Int']['output'];
  src: Scalars['String']['output'];
  type: IFrameType;
  width: Scalars['Int']['output'];
};

export enum IFrameType {
  IFRAME = 'IFRAME',
  EMBEDDED = 'EMBEDDED',
}

export type Insight = {
  __typename: 'Insight';
  ad: Ad;
  adId: Scalars['String']['output'];
  date: Scalars['Date']['output'];
  device: DeviceEnum;
  id: Scalars['ID']['output'];
  impressions: Scalars['BigInt']['output'];
  position: Scalars['String']['output'];
  publisher: PublisherEnum;
  /** Amount of money spent on the ad in cents */
  spend: Scalars['BigInt']['output'];
};

export enum InsightsColumnsGroupBy {
  adAccountId = 'adAccountId',
  adId = 'adId',
  device = 'device',
  position = 'position',
  publisher = 'publisher',
}

export enum InsightsColumnsOrderBy {
  spend_abs = 'spend_abs',
  impressions_abs = 'impressions_abs',
  cpm_abs = 'cpm_abs',
  spend_rel = 'spend_rel',
  impressions_rel = 'impressions_rel',
  cpm_rel = 'cpm_rel',
}

export type InsightsDatapoints = {
  __typename: 'InsightsDatapoints';
  cpm?: Maybe<Scalars['BigInt']['output']>;
  date: Scalars['Date']['output'];
  impressions: Scalars['BigInt']['output'];
  /** In Cents */
  spend: Scalars['BigInt']['output'];
};

export type InsightsDatapointsInput = {
  adAccountId?: InputMaybe<Scalars['String']['input']>;
  adId?: InputMaybe<Scalars['String']['input']>;
  dateFrom: Scalars['Date']['input'];
  dateTo: Scalars['Date']['input'];
  device?: InputMaybe<DeviceEnum>;
  interval: InsightsInterval;
  position?: InputMaybe<InsightsPosition>;
  publisher?: InputMaybe<PublisherEnum>;
};

export enum InsightsInterval {
  day = 'day',
  week = 'week',
  month = 'month',
  quarter = 'quarter',
}

export enum InsightsOrderBy {
  MobileWeb = 'MobileWeb',
  MobileApp = 'MobileApp',
  Desktop = 'Desktop',
  Unknown = 'Unknown',
}

export enum InsightsPosition {
  an_classic = 'an_classic',
  biz_disco_feed = 'biz_disco_feed',
  facebook_reels = 'facebook_reels',
  facebook_reels_overlay = 'facebook_reels_overlay',
  facebook_stories = 'facebook_stories',
  feed = 'feed',
  instagram_explore = 'instagram_explore',
  instagram_explore_grid_home = 'instagram_explore_grid_home',
  instagram_profile_feed = 'instagram_profile_feed',
  instagram_reels = 'instagram_reels',
  instagram_search = 'instagram_search',
  instagram_stories = 'instagram_stories',
  instream_video = 'instream_video',
  marketplace = 'marketplace',
  messenger_inbox = 'messenger_inbox',
  messenger_stories = 'messenger_stories',
  rewarded_video = 'rewarded_video',
  right_hand_column = 'right_hand_column',
  search = 'search',
  video_feeds = 'video_feeds',
  unknown = 'unknown',
}

export type Integration = {
  __typename: 'Integration';
  /** Caller is permitted to view this field if they are in an offspring organization */
  accessTokenExpiresAt?: Maybe<Scalars['Date']['output']>;
  /** Caller is permitted to view this field if they are in an offspring organization */
  adAccounts: Array<AdAccount>;
  /** Caller is permitted to view this field if they are in an offspring organization */
  createdAt: Scalars['Date']['output'];
  externalId?: Maybe<Scalars['String']['output']>;
  /** Caller is permitted to view this field if they are in an offspring organization */
  id: Scalars['ID']['output'];
  /** Caller is permitted to view this field if they are in an offspring organization */
  lastSyncedAt?: Maybe<Scalars['Date']['output']>;
  organization: Organization;
  organizationId: Scalars['String']['output'];
  /** Caller is permitted to view this field if they are in an offspring organization */
  refreshTokenExpiresAt?: Maybe<Scalars['Date']['output']>;
  /** Caller is permitted to view this field if they are in an offspring organization */
  status: IntegrationStatus;
  /** Caller is permitted to view this field if they are in an offspring organization */
  type: IntegrationType;
  /** Caller is permitted to view this field if they are in an offspring organization */
  updatedAt: Scalars['Date']['output'];
};

export type IntegrationListItem = {
  __typename: 'IntegrationListItem';
  authUrl?: Maybe<Scalars['String']['output']>;
  status: IntegrationStatus;
  type: IntegrationType;
};

export enum IntegrationStatus {
  ComingSoon = 'ComingSoon',
  Connected = 'Connected',
  Errored = 'Errored',
  Expired = 'Expired',
  Expiring = 'Expiring',
  NotConnected = 'NotConnected',
  Revoked = 'Revoked',
}

export enum IntegrationType {
  META = 'META',
  TIKTOK = 'TIKTOK',
  LINKEDIN = 'LINKEDIN',
  GOOGLE = 'GOOGLE',
  SNAPCHAT = 'SNAPCHAT',
  REDDIT = 'REDDIT',
}

export type InviteLinks = {
  __typename: 'InviteLinks';
  role: OrganizationRoleEnum;
  url: Scalars['String']['output'];
};

export type InviteUsersError = {
  __typename: 'InviteUsersError';
  email: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type InviteUsersErrors = Error & {
  __typename: 'InviteUsersErrors';
  error: Array<InviteUsersError>;
  message: Scalars['String']['output'];
};

export enum LoginProviderEnum {
  GOOGLE = 'GOOGLE',
}

export type MetaError = Error & {
  __typename: 'MetaError';
  code: Scalars['Int']['output'];
  errorSubCode: Scalars['Int']['output'];
  fbTraceId: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type Mutation = {
  __typename: 'Mutation';
  /** Use this mutation after the user has clicked on the non-personalized invite link and they have an account already */
  acceptLinkInvitationExistingUser: Tokens;
  /** Creates a link for the signed in org for a specific role */
  createInvitationLink: Scalars['String']['output'];
  createOrganization: Organization;
  deAuthIntegration: MutationDeAuthIntegrationResult;
  /** Deletes the invitation link for the given role */
  deleteInvitationLink: Scalars['Boolean']['output'];
  deleteOrganization: Organization;
  emulateAdmin: Tokens;
  forgetPassword: Scalars['Boolean']['output'];
  inviteUsers: MutationInviteUsersResult;
  login: Tokens;
  refreshData: Scalars['Boolean']['output'];
  removeUserFromOrganization: Scalars['Boolean']['output'];
  resendEmailConfirmation: Scalars['Boolean']['output'];
  resetPassword: Tokens;
  /** Use this mutation after the user has clicked on the personalized invite link on their email and they don't have an account yet */
  signUpInvitedUser: Tokens;
  signup: Tokens;
  switchOrganization: Tokens;
  updateOrganization: Organization;
  updateOrganizationAdAccounts: Organization;
  updateOrganizationUser: UserOrganization;
  updateUser: User;
};

export type MutationAcceptLinkInvitationExistingUserArgs = {
  inviteHash: Scalars['String']['input'];
};

export type MutationCreateInvitationLinkArgs = {
  role: OrganizationRoleEnum;
};

export type MutationCreateOrganizationArgs = {
  name: Scalars['String']['input'];
};

export type MutationDeAuthIntegrationArgs = {
  type: IntegrationType;
};

export type MutationDeleteInvitationLinkArgs = {
  role: OrganizationRoleEnum;
};

export type MutationDeleteOrganizationArgs = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
};

export type MutationEmulateAdminArgs = {
  organizationId: Scalars['String']['input'];
};

export type MutationForgetPasswordArgs = {
  email: Scalars['String']['input'];
};

export type MutationInviteUsersArgs = {
  emails: Array<Scalars['String']['input']>;
  role: OrganizationRoleEnum;
};

export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  token?: InputMaybe<Scalars['String']['input']>;
};

export type MutationRefreshDataArgs = {
  initial: Scalars['Boolean']['input'];
  integrationIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type MutationRemoveUserFromOrganizationArgs = {
  userId: Scalars['String']['input'];
};

export type MutationResetPasswordArgs = {
  password: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type MutationSignUpInvitedUserArgs = {
  firstName: Scalars['String']['input'];
  inviteHash: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationSignupArgs = {
  args: SignUpInput;
};

export type MutationSwitchOrganizationArgs = {
  organizationId: Scalars['String']['input'];
};

export type MutationUpdateOrganizationArgs = {
  name: Scalars['String']['input'];
};

export type MutationUpdateOrganizationAdAccountsArgs = {
  adAccountIds: Array<Scalars['String']['input']>;
  integrationType: IntegrationType;
};

export type MutationUpdateOrganizationUserArgs = {
  role?: InputMaybe<OrganizationRoleEnum>;
  userId: Scalars['String']['input'];
};

export type MutationUpdateUserArgs = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  oldPassword?: InputMaybe<Scalars['String']['input']>;
};

export type MutationDeAuthIntegrationResult = BaseError | MetaError | MutationDeAuthIntegrationSuccess;

export type MutationDeAuthIntegrationSuccess = {
  __typename: 'MutationDeAuthIntegrationSuccess';
  data: Scalars['String']['output'];
};

export type MutationInviteUsersResult = InviteUsersErrors | MutationInviteUsersSuccess;

export type MutationInviteUsersSuccess = {
  __typename: 'MutationInviteUsersSuccess';
  data: Scalars['Boolean']['output'];
};

export enum OrderBy {
  asc = 'asc',
  desc = 'desc',
}

export type Organization = {
  __typename: 'Organization';
  adAccounts: Array<AdAccount>;
  createdAt: Scalars['Date']['output'];
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  integrations: Array<Integration>;
  isRoot: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
  userOrganizations: Array<UserOrganization>;
};

export enum OrganizationRoleEnum {
  /** Ability to manage organization settings, integrations and members */
  ORG_ADMIN = 'ORG_ADMIN',
  /** Ability to manage organization settings and members. */
  ORG_OPERATOR = 'ORG_OPERATOR',
  /** Does not have any special permissions */
  ORG_MEMBER = 'ORG_MEMBER',
}

export type PageInfo = {
  __typename: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Pagination = {
  hasNext: Scalars['Boolean']['output'];
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type PrismaClientKnownRequestError = Error & {
  __typename: 'PrismaClientKnownRequestError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export enum PublisherEnum {
  Facebook = 'Facebook',
  Instagram = 'Instagram',
  Messenger = 'Messenger',
  AudienceNetwork = 'AudienceNetwork',
  LinkedIn = 'LinkedIn',
  TikTok = 'TikTok',
  GlobalAppBundle = 'GlobalAppBundle',
  Pangle = 'Pangle',
  Unknown = 'Unknown',
}

export type Query = {
  __typename: 'Query';
  /** Return all the adAccounts for that are available on the parent organization. If this is the root organization then it returns all the addAccounts of this channel. */
  availableOrganizationAdAccounts: Array<AdAccount>;
  checkConfirmInvitedUserHashValidity: Scalars['Boolean']['output'];
  insightDatapoints: Array<InsightsDatapoints>;
  insightIFrame?: Maybe<IFrame>;
  insights: GroupedInsight;
  integrations: Array<Integration>;
  /** Returns the invitation links for the signed in org */
  inviteLinks: Array<InviteLinks>;
  lastThreeMonthsAds: Array<Ad>;
  loginProviders: Array<GenerateGoogleAuthUrlResponse>;
  me: User;
  organization: Organization;
  /** Return the adAccounts for a channel that are associated with the organization. */
  organizationAdAccounts: Array<AdAccount>;
  organizations: Array<Organization>;
  /** Uses the refresh token to generate a new token */
  refreshToken: Scalars['String']['output'];
  settingsChannels: Array<IntegrationListItem>;
};

export type QueryAvailableOrganizationAdAccountsArgs = {
  channel: IntegrationType;
};

export type QueryCheckConfirmInvitedUserHashValidityArgs = {
  invitedHash: Scalars['String']['input'];
};

export type QueryInsightDatapointsArgs = {
  args: InsightsDatapointsInput;
};

export type QueryInsightIFrameArgs = {
  adId: Scalars['String']['input'];
  device?: InputMaybe<DeviceEnum>;
  position?: InputMaybe<Scalars['String']['input']>;
  publisher?: InputMaybe<PublisherEnum>;
};

export type QueryInsightsArgs = {
  filter: FilterInsightsInput;
};

export type QueryIntegrationsArgs = {
  type?: InputMaybe<IntegrationType>;
};

export type QueryLoginProvidersArgs = {
  inviteHash?: InputMaybe<Scalars['String']['input']>;
};

export type QueryOrganizationAdAccountsArgs = {
  channel: IntegrationType;
};

export type SignUpInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  inviteHash?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Subscription = {
  __typename: 'Subscription';
  channelInitialSetupProgress: ChannelInitialProgressPayload;
};

export type TokenDto = {
  __typename: 'TokenDto';
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
  user: User;
};

export type Tokens = {
  __typename: 'Tokens';
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
};

/** Caller is permitted to view this type if is the user or an admin. Some fields are also permitted if the caller and the user are in a common organization */
export type User = {
  __typename: 'User';
  allRoles: Array<AllRoles>;
  createdAt: Scalars['Date']['output'];
  currentOrganization?: Maybe<Organization>;
  currentOrganizationId?: Maybe<Scalars['String']['output']>;
  /** Caller is permitted to view this field if they are in a common organization */
  email: Scalars['String']['output'];
  /** Caller is permitted to view this field if they are in a common organization */
  firstName: Scalars['String']['output'];
  /** Caller is permitted to view this field if they are in a common organization */
  id: Scalars['ID']['output'];
  /** Caller is permitted to view this field if they are in a common organization */
  lastName: Scalars['String']['output'];
  organizations: Array<UserOrganization>;
  /** Caller is permitted to view this field if they are in a common organization */
  photoUrl?: Maybe<Scalars['String']['output']>;
  status: UserStatus;
  updatedAt: Scalars['Date']['output'];
  userRoles: Array<Scalars['String']['output']>;
};

export type UserOrganization = {
  __typename: 'UserOrganization';
  organization: Organization;
  organizationId: Scalars['String']['output'];
  role: OrganizationRoleEnum;
  status: UserOrganizationStatus;
  user: User;
  userId: Scalars['ID']['output'];
};

export enum UserOrganizationStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
}

export enum UserStatus {
  EMAIL_UNCONFIRMED = 'EMAIL_UNCONFIRMED',
  EMAIL_CONFIRMED = 'EMAIL_CONFIRMED',
}

export type ZodError = Error & {
  __typename: 'ZodError';
  fieldErrors: Array<ZodFieldError>;
  message: Scalars['String']['output'];
};

export type ZodFieldError = {
  __typename: 'ZodFieldError';
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type AdAccountsQueryVariables = Exact<{ [key: string]: never }>;

export type AdAccountsQuery = {
  __typename: 'Query';
  integrations: Array<{
    __typename: 'Integration';
    lastSyncedAt?: Date | null;
    adAccounts: Array<{ __typename: 'AdAccount'; id: string; name: string; currency: CurrencyEnum; adCount: number }>;
  }>;
};

export type InsightsQueryVariables = Exact<{
  adAccountIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  adIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  dateFrom?: InputMaybe<Scalars['Date']['input']>;
  dateTo?: InputMaybe<Scalars['Date']['input']>;
  devices?: InputMaybe<Array<DeviceEnum> | DeviceEnum>;
  interval: InsightsInterval;
  publishers?: InputMaybe<Array<PublisherEnum> | PublisherEnum>;
  positions?: InputMaybe<Array<InsightsPosition> | InsightsPosition>;
  order?: InputMaybe<OrderBy>;
  orderBy: InsightsColumnsOrderBy;
  groupBy?: InputMaybe<Array<InsightsColumnsGroupBy> | InsightsColumnsGroupBy>;
  pageSize: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
}>;

export type InsightsQuery = {
  __typename: 'Query';
  insights: {
    __typename: 'GroupedInsight';
    hasNext: boolean;
    edges: Array<{
      __typename: 'GroupedInsights';
      id: string;
      adAccountId?: string | null;
      adAccountName?: string | null;
      adId?: string | null;
      adName?: string | null;
      currency: CurrencyEnum;
      device?: DeviceEnum | null;
      publisher?: PublisherEnum | null;
      position?: string | null;
      datapoints: Array<{
        __typename: 'InsightsDatapoints';
        date: Date;
        spend: bigint;
        impressions: bigint;
        cpm?: bigint | null;
      }>;
      iFrame?: { __typename: 'IFrame'; src: string; width: number; height: number; type: IFrameType } | null;
    }>;
  };
};

export type LastThreeMonthsAdsQueryVariables = Exact<{ [key: string]: never }>;

export type LastThreeMonthsAdsQuery = {
  __typename: 'Query';
  lastThreeMonthsAds: Array<{ __typename: 'Ad'; id: string; name?: string | null }>;
};

export type SettingsChannelsQueryVariables = Exact<{ [key: string]: never }>;

export type SettingsChannelsQuery = {
  __typename: 'Query';
  settingsChannels: Array<{
    __typename: 'IntegrationListItem';
    type: IntegrationType;
    status: IntegrationStatus;
    authUrl?: string | null;
  }>;
};

export type IntegrationsQueryVariables = Exact<{ [key: string]: never }>;

export type IntegrationsQuery = {
  __typename: 'Query';
  integrations: Array<{
    __typename: 'Integration';
    type: IntegrationType;
    lastSyncedAt?: Date | null;
    status: IntegrationStatus;
    adAccounts: Array<{ __typename: 'AdAccount'; adCount: number }>;
  }>;
};

export type DeAuthIntegrationMutationVariables = Exact<{
  type: IntegrationType;
}>;

export type DeAuthIntegrationMutation = {
  __typename: 'Mutation';
  deAuthIntegration:
    | { __typename: 'BaseError'; message: string }
    | { __typename: 'MetaError'; message: string }
    | { __typename: 'MutationDeAuthIntegrationSuccess'; data: string };
};

export type ChannelInitialSetupProgressSubscriptionVariables = Exact<{ [key: string]: never }>;

export type ChannelInitialSetupProgressSubscription = {
  __typename: 'Subscription';
  channelInitialSetupProgress: {
    __typename: 'ChannelInitialProgressPayload';
    progress: number;
    channel: IntegrationType;
  };
};

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;

export type LoginMutation = {
  __typename: 'Mutation';
  login: { __typename: 'Tokens'; token: string; refreshToken: string };
};

export type SignupMutationVariables = Exact<{
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  inviteHash?: InputMaybe<Scalars['String']['input']>;
}>;

export type SignupMutation = {
  __typename: 'Mutation';
  signup: { __typename: 'Tokens'; token: string; refreshToken: string };
};

export type ForgetPasswordMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;

export type ForgetPasswordMutation = { __typename: 'Mutation'; forgetPassword: boolean };

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;

export type ResetPasswordMutation = {
  __typename: 'Mutation';
  resetPassword: { __typename: 'Tokens'; token: string; refreshToken: string };
};

export type RefreshTokenQueryVariables = Exact<{ [key: string]: never }>;

export type RefreshTokenQuery = { __typename: 'Query'; refreshToken: string };

export type ResendEmailConfirmationMutationVariables = Exact<{ [key: string]: never }>;

export type ResendEmailConfirmationMutation = { __typename: 'Mutation'; resendEmailConfirmation: boolean };

export type LoginProvidersQueryVariables = Exact<{
  inviteHash?: InputMaybe<Scalars['String']['input']>;
}>;

export type LoginProvidersQuery = {
  __typename: 'Query';
  loginProviders: Array<{ __typename: 'GenerateGoogleAuthUrlResponse'; url: string; type: LoginProviderEnum }>;
};

export type GetOrganizationQueryVariables = Exact<{ [key: string]: never }>;

export type GetOrganizationQuery = {
  __typename: 'Query';
  organization: {
    __typename: 'Organization';
    id: string;
    userOrganizations: Array<{
      __typename: 'UserOrganization';
      userId: string;
      role: OrganizationRoleEnum;
      status: UserOrganizationStatus;
      user: {
        __typename: 'User';
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        photoUrl?: string | null;
      };
    }>;
  };
};

export type UpdateOrganizationUserMutationVariables = Exact<{
  userId: Scalars['String']['input'];
  role?: InputMaybe<OrganizationRoleEnum>;
}>;

export type UpdateOrganizationUserMutation = {
  __typename: 'Mutation';
  updateOrganizationUser: {
    __typename: 'UserOrganization';
    role: OrganizationRoleEnum;
    organization: { __typename: 'Organization'; id: string };
  };
};

export type CreateOrganizationMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;

export type CreateOrganizationMutation = {
  __typename: 'Mutation';
  createOrganization: { __typename: 'Organization'; id: string; name: string };
};

export type UpdateOrganizationMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;

export type UpdateOrganizationMutation = {
  __typename: 'Mutation';
  updateOrganization: { __typename: 'Organization'; id: string; name: string };
};

export type SwitchOrganizationMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;

export type SwitchOrganizationMutation = {
  __typename: 'Mutation';
  switchOrganization: { __typename: 'Tokens'; token: string; refreshToken: string };
};

export type DeleteOrganizationMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;

export type DeleteOrganizationMutation = {
  __typename: 'Mutation';
  deleteOrganization: { __typename: 'Organization'; id: string };
};

export type InviteUsersMutationVariables = Exact<{
  emails: Array<Scalars['String']['input']> | Scalars['String']['input'];
  role: OrganizationRoleEnum;
}>;

export type InviteUsersMutation = {
  __typename: 'Mutation';
  inviteUsers:
    | {
        __typename: 'InviteUsersErrors';
        error: Array<{ __typename: 'InviteUsersError'; email: string; message: string }>;
      }
    | { __typename: 'MutationInviteUsersSuccess'; data: boolean };
};

export type AvailableOrganizationAdAccountsQueryVariables = Exact<{
  channel: IntegrationType;
}>;

export type AvailableOrganizationAdAccountsQuery = {
  __typename: 'Query';
  availableOrganizationAdAccounts: Array<{
    __typename: 'AdAccount';
    id: string;
    adCount: number;
    name: string;
    isConnectedToCurrentOrg: boolean;
  }>;
};

export type RemoveUserFromOrganizationMutationVariables = Exact<{
  userId: Scalars['String']['input'];
}>;

export type RemoveUserFromOrganizationMutation = { __typename: 'Mutation'; removeUserFromOrganization: boolean };

export type OrganizationAdAccountsQueryVariables = Exact<{
  channel: IntegrationType;
}>;

export type OrganizationAdAccountsQuery = {
  __typename: 'Query';
  organizationAdAccounts: Array<{ __typename: 'AdAccount'; id: string; adCount: number; name: string }>;
};

export type UpdateOrganizationAdAccountsMutationVariables = Exact<{
  adAccountIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  channel: IntegrationType;
}>;

export type UpdateOrganizationAdAccountsMutation = {
  __typename: 'Mutation';
  updateOrganizationAdAccounts: { __typename: 'Organization'; id: string };
};

export type UpdateUserMutationVariables = Exact<{
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  oldPassword?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
}>;

export type UpdateUserMutation = {
  __typename: 'Mutation';
  updateUser: {
    __typename: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string | null;
    allRoles: Array<AllRoles>;
    currentOrganizationId?: string | null;
    organizations: Array<{
      __typename: 'UserOrganization';
      organization: { __typename: 'Organization'; id: string; name: string };
    }>;
    currentOrganization?: {
      __typename: 'Organization';
      id: string;
      name: string;
      isRoot: boolean;
      parentId?: string | null;
      integrations: Array<{
        __typename: 'Integration';
        status: IntegrationStatus;
        type: IntegrationType;
        accessTokenExpiresAt?: Date | null;
      }>;
    } | null;
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename: 'Query';
  me: {
    __typename: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string | null;
    allRoles: Array<AllRoles>;
    currentOrganizationId?: string | null;
    organizations: Array<{
      __typename: 'UserOrganization';
      organization: { __typename: 'Organization'; id: string; name: string };
    }>;
    currentOrganization?: {
      __typename: 'Organization';
      id: string;
      name: string;
      isRoot: boolean;
      parentId?: string | null;
      integrations: Array<{
        __typename: 'Integration';
        status: IntegrationStatus;
        type: IntegrationType;
        accessTokenExpiresAt?: Date | null;
      }>;
    } | null;
  };
};

export type UserFieldsFragment = {
  __typename: 'User';
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string | null;
  allRoles: Array<AllRoles>;
  currentOrganizationId?: string | null;
  organizations: Array<{
    __typename: 'UserOrganization';
    organization: { __typename: 'Organization'; id: string; name: string };
  }>;
  currentOrganization?: {
    __typename: 'Organization';
    id: string;
    name: string;
    isRoot: boolean;
    parentId?: string | null;
    integrations: Array<{
      __typename: 'Integration';
      status: IntegrationStatus;
      type: IntegrationType;
      accessTokenExpiresAt?: Date | null;
    }>;
  } | null;
};

export const UserFieldsFragmentDoc = gql`
  fragment UserFields on User {
    id
    firstName
    lastName
    email
    photoUrl
    allRoles
    organizations {
      organization {
        id
        name
      }
    }
    currentOrganizationId
    currentOrganization {
      id
      name
      isRoot
      parentId
      integrations {
        status
        type
        accessTokenExpiresAt
      }
    }
  }
`;
export const AdAccountsDocument = gql`
  query adAccounts {
    integrations {
      lastSyncedAt
      adAccounts {
        id
        name
        currency
        adCount
      }
    }
  }
`;

export function useAdAccountsQuery(options?: Omit<Urql.UseQueryArgs<AdAccountsQueryVariables>, 'query'>) {
  return Urql.useQuery<AdAccountsQuery, AdAccountsQueryVariables>({ query: AdAccountsDocument, ...options });
}
export const InsightsDocument = gql`
  query insights(
    $adAccountIds: [String!]
    $adIds: [String!]
    $dateFrom: Date
    $dateTo: Date
    $devices: [DeviceEnum!]
    $interval: InsightsInterval!
    $publishers: [PublisherEnum!]
    $positions: [InsightsPosition!]
    $order: OrderBy
    $orderBy: InsightsColumnsOrderBy!
    $groupBy: [InsightsColumnsGroupBy!]
    $pageSize: Int!
    $page: Int!
  ) {
    insights(
      filter: {
        adAccountIds: $adAccountIds
        adIds: $adIds
        dateFrom: $dateFrom
        dateTo: $dateTo
        devices: $devices
        interval: $interval
        publishers: $publishers
        positions: $positions
        order: $order
        orderBy: $orderBy
        groupBy: $groupBy
        pageSize: $pageSize
        page: $page
      }
    ) {
      hasNext
      edges {
        id
        adAccountId
        adAccountName
        adId
        adName
        currency
        datapoints {
          date
          spend
          impressions
          cpm
        }
        iFrame {
          src
          width
          height
          type
        }
        device
        publisher
        position
      }
    }
  }
`;

export function useInsightsQuery(options: Omit<Urql.UseQueryArgs<InsightsQueryVariables>, 'query'>) {
  return Urql.useQuery<InsightsQuery, InsightsQueryVariables>({ query: InsightsDocument, ...options });
}
export const LastThreeMonthsAdsDocument = gql`
  query lastThreeMonthsAds {
    lastThreeMonthsAds {
      id
      name
    }
  }
`;

export function useLastThreeMonthsAdsQuery(
  options?: Omit<Urql.UseQueryArgs<LastThreeMonthsAdsQueryVariables>, 'query'>,
) {
  return Urql.useQuery<LastThreeMonthsAdsQuery, LastThreeMonthsAdsQueryVariables>({
    query: LastThreeMonthsAdsDocument,
    ...options,
  });
}
export const SettingsChannelsDocument = gql`
  query settingsChannels {
    settingsChannels {
      type
      status
      authUrl
    }
  }
`;

export function useSettingsChannelsQuery(options?: Omit<Urql.UseQueryArgs<SettingsChannelsQueryVariables>, 'query'>) {
  return Urql.useQuery<SettingsChannelsQuery, SettingsChannelsQueryVariables>({
    query: SettingsChannelsDocument,
    ...options,
  });
}
export const IntegrationsDocument = gql`
  query integrations {
    integrations {
      type
      lastSyncedAt
      status
      adAccounts {
        adCount
      }
    }
  }
`;

export function useIntegrationsQuery(options?: Omit<Urql.UseQueryArgs<IntegrationsQueryVariables>, 'query'>) {
  return Urql.useQuery<IntegrationsQuery, IntegrationsQueryVariables>({ query: IntegrationsDocument, ...options });
}
export const DeAuthIntegrationDocument = gql`
  mutation deAuthIntegration($type: IntegrationType!) {
    deAuthIntegration(type: $type) {
      ... on BaseError {
        message
      }
      ... on MetaError {
        message
      }
      ... on MutationDeAuthIntegrationSuccess {
        data
      }
    }
  }
`;

export function useDeAuthIntegrationMutation() {
  return Urql.useMutation<DeAuthIntegrationMutation, DeAuthIntegrationMutationVariables>(DeAuthIntegrationDocument);
}
export const ChannelInitialSetupProgressDocument = gql`
  subscription channelInitialSetupProgress {
    channelInitialSetupProgress {
      progress
      channel
    }
  }
`;

export function useChannelInitialSetupProgressSubscription<TData = ChannelInitialSetupProgressSubscription>(
  options?: Omit<Urql.UseSubscriptionArgs<ChannelInitialSetupProgressSubscriptionVariables>, 'query'>,
  handler?: Urql.SubscriptionHandler<ChannelInitialSetupProgressSubscription, TData>,
) {
  return Urql.useSubscription<
    ChannelInitialSetupProgressSubscription,
    TData,
    ChannelInitialSetupProgressSubscriptionVariables
  >({ query: ChannelInitialSetupProgressDocument, ...options }, handler);
}
export const LoginDocument = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
    }
  }
`;

export function useLoginMutation() {
  return Urql.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument);
}
export const SignupDocument = gql`
  mutation signup($email: String!, $firstName: String!, $lastName: String!, $password: String!, $inviteHash: String) {
    signup(
      args: { email: $email, firstName: $firstName, lastName: $lastName, password: $password, inviteHash: $inviteHash }
    ) {
      token
      refreshToken
    }
  }
`;

export function useSignupMutation() {
  return Urql.useMutation<SignupMutation, SignupMutationVariables>(SignupDocument);
}
export const ForgetPasswordDocument = gql`
  mutation forgetPassword($email: String!) {
    forgetPassword(email: $email)
  }
`;

export function useForgetPasswordMutation() {
  return Urql.useMutation<ForgetPasswordMutation, ForgetPasswordMutationVariables>(ForgetPasswordDocument);
}
export const ResetPasswordDocument = gql`
  mutation resetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      token
      refreshToken
    }
  }
`;

export function useResetPasswordMutation() {
  return Urql.useMutation<ResetPasswordMutation, ResetPasswordMutationVariables>(ResetPasswordDocument);
}
export const RefreshTokenDocument = gql`
  query refreshToken {
    refreshToken
  }
`;

export function useRefreshTokenQuery(options?: Omit<Urql.UseQueryArgs<RefreshTokenQueryVariables>, 'query'>) {
  return Urql.useQuery<RefreshTokenQuery, RefreshTokenQueryVariables>({ query: RefreshTokenDocument, ...options });
}
export const ResendEmailConfirmationDocument = gql`
  mutation resendEmailConfirmation {
    resendEmailConfirmation
  }
`;

export function useResendEmailConfirmationMutation() {
  return Urql.useMutation<ResendEmailConfirmationMutation, ResendEmailConfirmationMutationVariables>(
    ResendEmailConfirmationDocument,
  );
}
export const LoginProvidersDocument = gql`
  query loginProviders($inviteHash: String) {
    loginProviders(inviteHash: $inviteHash) {
      url
      type
    }
  }
`;

export function useLoginProvidersQuery(options?: Omit<Urql.UseQueryArgs<LoginProvidersQueryVariables>, 'query'>) {
  return Urql.useQuery<LoginProvidersQuery, LoginProvidersQueryVariables>({
    query: LoginProvidersDocument,
    ...options,
  });
}
export const GetOrganizationDocument = gql`
  query getOrganization {
    organization {
      id
      userOrganizations {
        userId
        role
        status
        user {
          id
          email
          firstName
          lastName
          photoUrl
        }
      }
    }
  }
`;

export function useGetOrganizationQuery(options?: Omit<Urql.UseQueryArgs<GetOrganizationQueryVariables>, 'query'>) {
  return Urql.useQuery<GetOrganizationQuery, GetOrganizationQueryVariables>({
    query: GetOrganizationDocument,
    ...options,
  });
}
export const UpdateOrganizationUserDocument = gql`
  mutation updateOrganizationUser($userId: String!, $role: OrganizationRoleEnum) {
    updateOrganizationUser(userId: $userId, role: $role) {
      role
      organization {
        id
      }
    }
  }
`;

export function useUpdateOrganizationUserMutation() {
  return Urql.useMutation<UpdateOrganizationUserMutation, UpdateOrganizationUserMutationVariables>(
    UpdateOrganizationUserDocument,
  );
}
export const CreateOrganizationDocument = gql`
  mutation createOrganization($name: String!) {
    createOrganization(name: $name) {
      id
      name
    }
  }
`;

export function useCreateOrganizationMutation() {
  return Urql.useMutation<CreateOrganizationMutation, CreateOrganizationMutationVariables>(CreateOrganizationDocument);
}
export const UpdateOrganizationDocument = gql`
  mutation updateOrganization($name: String!) {
    updateOrganization(name: $name) {
      id
      name
    }
  }
`;

export function useUpdateOrganizationMutation() {
  return Urql.useMutation<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>(UpdateOrganizationDocument);
}
export const SwitchOrganizationDocument = gql`
  mutation switchOrganization($organizationId: String!) {
    switchOrganization(organizationId: $organizationId) {
      token
      refreshToken
    }
  }
`;

export function useSwitchOrganizationMutation() {
  return Urql.useMutation<SwitchOrganizationMutation, SwitchOrganizationMutationVariables>(SwitchOrganizationDocument);
}
export const DeleteOrganizationDocument = gql`
  mutation deleteOrganization($organizationId: String!) {
    deleteOrganization(organizationId: $organizationId) {
      id
    }
  }
`;

export function useDeleteOrganizationMutation() {
  return Urql.useMutation<DeleteOrganizationMutation, DeleteOrganizationMutationVariables>(DeleteOrganizationDocument);
}
export const InviteUsersDocument = gql`
  mutation inviteUsers($emails: [String!]!, $role: OrganizationRoleEnum!) {
    inviteUsers(emails: $emails, role: $role) {
      ... on MutationInviteUsersSuccess {
        data
      }
      ... on InviteUsersErrors {
        error {
          email
          message
        }
      }
    }
  }
`;

export function useInviteUsersMutation() {
  return Urql.useMutation<InviteUsersMutation, InviteUsersMutationVariables>(InviteUsersDocument);
}
export const AvailableOrganizationAdAccountsDocument = gql`
  query availableOrganizationAdAccounts($channel: IntegrationType!) {
    availableOrganizationAdAccounts(channel: $channel) {
      id
      adCount
      name
      isConnectedToCurrentOrg
    }
  }
`;

export function useAvailableOrganizationAdAccountsQuery(
  options: Omit<Urql.UseQueryArgs<AvailableOrganizationAdAccountsQueryVariables>, 'query'>,
) {
  return Urql.useQuery<AvailableOrganizationAdAccountsQuery, AvailableOrganizationAdAccountsQueryVariables>({
    query: AvailableOrganizationAdAccountsDocument,
    ...options,
  });
}
export const RemoveUserFromOrganizationDocument = gql`
  mutation removeUserFromOrganization($userId: String!) {
    removeUserFromOrganization(userId: $userId)
  }
`;

export function useRemoveUserFromOrganizationMutation() {
  return Urql.useMutation<RemoveUserFromOrganizationMutation, RemoveUserFromOrganizationMutationVariables>(
    RemoveUserFromOrganizationDocument,
  );
}
export const OrganizationAdAccountsDocument = gql`
  query organizationAdAccounts($channel: IntegrationType!) {
    organizationAdAccounts(channel: $channel) {
      id
      adCount
      name
    }
  }
`;

export function useOrganizationAdAccountsQuery(
  options: Omit<Urql.UseQueryArgs<OrganizationAdAccountsQueryVariables>, 'query'>,
) {
  return Urql.useQuery<OrganizationAdAccountsQuery, OrganizationAdAccountsQueryVariables>({
    query: OrganizationAdAccountsDocument,
    ...options,
  });
}
export const UpdateOrganizationAdAccountsDocument = gql`
  mutation updateOrganizationAdAccounts($adAccountIds: [String!]!, $channel: IntegrationType!) {
    updateOrganizationAdAccounts(adAccountIds: $adAccountIds, integrationType: $channel) {
      id
    }
  }
`;

export function useUpdateOrganizationAdAccountsMutation() {
  return Urql.useMutation<UpdateOrganizationAdAccountsMutation, UpdateOrganizationAdAccountsMutationVariables>(
    UpdateOrganizationAdAccountsDocument,
  );
}
export const UpdateUserDocument = gql`
  mutation updateUser($firstName: String, $lastName: String, $oldPassword: String, $newPassword: String) {
    updateUser(firstName: $firstName, lastName: $lastName, oldPassword: $oldPassword, newPassword: $newPassword) {
      ...UserFields
    }
  }
  ${UserFieldsFragmentDoc}
`;

export function useUpdateUserMutation() {
  return Urql.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument);
}
export const MeDocument = gql`
  query me {
    me {
      ...UserFields
    }
  }
  ${UserFieldsFragmentDoc}
`;

export function useMeQuery(options?: Omit<Urql.UseQueryArgs<MeQueryVariables>, 'query'>) {
  return Urql.useQuery<MeQuery, MeQueryVariables>({ query: MeDocument, ...options });
}
