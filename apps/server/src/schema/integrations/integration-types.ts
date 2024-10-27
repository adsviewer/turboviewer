import {
  CurrencyEnum,
  DeviceEnum,
  type Integration,
  IntegrationStatus,
  IntegrationTypeEnum,
  prisma,
  PublisherEnum,
} from '@repo/database';
import {
  type FilterInsightsInputType,
  insightsColumnsGroupBy,
  insightsColumnsOrderBy,
  type InsightsSearchExpression,
  InsightsSearchField,
  InsightsSearchOperator,
  type InsightsSearchTerm,
  MetaError,
} from '@repo/channel-utils';
import { getDateDiffIn, getTomorrowStartOfDay, type IntervalType } from '@repo/utils';
import type { InputShapeFromFields } from '@pothos/core';
import { getRootOrganizationId } from '@repo/backend-shared';
import { type ChannelInitialProgressPayload } from '@repo/pubsub';
import { type NewIntegrationEvent } from '@repo/shared-types';
import { builder } from '../builder';
import { ErrorInterface } from '../errors';
import type { GraphQLContext } from '../../context';

export enum IntegrationStatusEnum {
  ComingSoon = 'ComingSoon',
  Connected = 'Connected',
  Errored = 'Errored',
  Expired = 'Expired',
  Expiring = 'Expiring',
  NotConnected = 'NotConnected',
  Revoked = 'Revoked',
}

export const ShouldConnectIntegrationStatuses = [
  IntegrationStatusEnum.Connected,
  IntegrationStatusEnum.Errored,
  IntegrationStatusEnum.Expired,
  IntegrationStatusEnum.Expiring,
  IntegrationStatusEnum.NotConnected,
  IntegrationStatusEnum.Revoked,
];

export const IntegrationStatusDto = builder.enumType(IntegrationStatusEnum, {
  name: 'IntegrationStatus',
});

export const IntegrationTypeDto = builder.enumType(IntegrationTypeEnum, {
  name: 'IntegrationType',
});

export const IntegrationListItemDto = builder.simpleObject('IntegrationListItem', {
  fields: (t) => ({
    type: t.field({ type: IntegrationTypeDto, nullable: false }),
    status: t.field({ type: IntegrationStatusDto, nullable: false }),
    authUrl: t.string({
      authScopes: { $all: { isRootOrg: true, isOrgAdmin: true } },
      unauthorizedResolver: () => null,
      nullable: true,
    }),
  }),
});

export const IntegrationDto = builder.prismaObject('Integration', {
  authScopes: (integration, ctx) => {
    const baseScopes = baseIntegrationDtoAuthScopes(integration, ctx);
    return baseScopes ?? false;
  },
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false, ...offspringOrgFieldProps }),
    organizationId: t.exposeString('organizationId', { nullable: false }),

    type: t.expose('type', { type: IntegrationTypeDto, nullable: false, ...offspringOrgFieldProps }),
    externalId: t.exposeString('externalId', { nullable: true }),

    accessTokenExpiresAt: t.expose('accessTokenExpiresAt', { type: 'Date', nullable: true, ...offspringOrgFieldProps }),
    refreshTokenExpiresAt: t.expose('refreshTokenExpiresAt', {
      type: 'Date',
      nullable: true,
      ...offspringOrgFieldProps,
    }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false, ...offspringOrgFieldProps }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false, ...offspringOrgFieldProps }),
    lastSyncedAt: t.expose('lastSyncedAt', { type: 'Date', nullable: true, ...offspringOrgFieldProps }),
    status: t.field({
      type: IntegrationStatusDto,
      nullable: false,
      ...offspringOrgFieldProps,
      resolve: (root) => {
        return getIntegrationStatus(root);
      },
    }),

    organization: t.relation('organization', { nullable: false }),
    adAccounts: t.relation('adAccounts', {
      nullable: false,
      ...offspringOrgFieldProps,
      query: (_args, ctx) =>
        ctx.isAdmin
          ? {}
          : {
              where: {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- is checked in baseScopes
                organizations: { some: { id: ctx.organizationId! } },
              },
            },
    }),
  }),
});

const baseIntegrationDtoAuthScopes = (integration: Integration, ctx: GraphQLContext): boolean | undefined => {
  if (ctx.isAdmin) return true;
  if (!ctx.organizationId) return false;
  if (integration.organizationId === ctx.organizationId) return true;
  return undefined;
};

const offSpringOrgAuthScopes = async (integration: Integration, ctx: GraphQLContext): Promise<boolean> => {
  const baseScopes = baseIntegrationDtoAuthScopes(integration, ctx);
  if (baseScopes !== undefined) return baseScopes;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked in baseScopes
  const rootOrgId = await getRootOrganizationId(ctx.organizationId!);
  return rootOrgId === integration.organizationId;
};

const offspringOrgFieldProps = {
  skipTypeScopes: true,
  description: 'Caller is permitted to view this field if they are in an offspring organization',
  authScopes: (integration: Integration, _args: InputShapeFromFields<NonNullable<unknown>>, ctx: GraphQLContext) =>
    offSpringOrgAuthScopes(integration, ctx),
};

builder.objectType(MetaError, {
  name: 'MetaError',
  interfaces: [ErrorInterface],
  fields: (t) => ({
    code: t.exposeInt('code', { nullable: false }),
    errorSubCode: t.exposeInt('errorSubCode', { nullable: false }),
    fbTraceId: t.exposeString('fbTraceId', { nullable: false }),
  }),
});

export const ChannelInitialProgressPayloadDto = builder
  .objectRef<ChannelInitialProgressPayload>('ChannelInitialProgressPayload')
  .implement({
    fields: (t) => ({
      channel: t.expose('channel', { type: IntegrationTypeDto, nullable: false }),
      progress: t.exposeFloat('progress', { nullable: false }),
    }),
  });

export const NewIntegrationEventDto = builder.objectRef<NewIntegrationEvent>('NewIntegrationEvent').implement({
  fields: (t) => ({
    id: t.exposeString('id', { nullable: false }),
    type: t.expose('type', { type: IntegrationTypeDto, nullable: false }),
  }),
});

export const CurrencyEnumDto = builder.enumType(CurrencyEnum, {
  name: 'CurrencyEnum',
});

export const AdAccountDto = builder.prismaObject('AdAccount', {
  authScopes: { isInOrg: true },
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    externalId: t.exposeString('externalId', { nullable: false }),

    type: t.expose('type', { type: IntegrationTypeDto, nullable: false }),
    currency: t.expose('currency', { type: CurrencyEnumDto, nullable: false }),
    name: t.exposeString('name', { nullable: false }),
    lastSyncedAt: t.expose('updatedAt', { type: 'Date', nullable: true }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    adCount: t.int({
      nullable: false,
      resolve: async (root, _args, _ctx) => {
        return prisma.ad.count({ where: { adAccountId: root.id } });
      },
    }),
    advertisements: t.relatedConnection('advertisements', {
      cursor: 'id',
      nullable: false,
      // @ts-expect-error -- this is probably a bug in the type definitions
      edgesNullable: { list: false, items: true },
      nodeNullable: false,
    }),
    insights: t.relation('insights', { nullable: false }),
    integration: t.field({
      type: IntegrationDto,
      nullable: false,
      resolve: (root, _args, _ctx) =>
        prisma.integration.findFirstOrThrow({ where: { adAccounts: { some: { id: root.id } } } }),
    }),
    organizations: t.relation('organizations', {
      nullable: false,
      query: (_args, ctx) =>
        ctx.isAdmin
          ? {}
          : {
              where: {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- is checked in baseScopes
                id: ctx.organizationId!,
              },
            },
    }),
    isConnectedToCurrentOrg: t.boolean({
      description: 'Whether the ad account is connected to the current organization',
      nullable: false,
      resolve: async (root, _args, ctx) => {
        if (!ctx.organizationId) return false;
        const organization = await prisma.organization.findUnique({
          where: { id: ctx.organizationId, adAccounts: { some: { id: root.id } } },
        });
        return Boolean(organization);
      },
    }),
  }),
});

export const InsightsColumnsOrderByDto = builder.enumType('InsightsColumnsOrderBy', {
  values: insightsColumnsOrderBy,
});

export const InsightsColumnsGroupByDto = builder.enumType('InsightsColumnsGroupBy', {
  values: insightsColumnsGroupBy,
});

export const AdDto = builder.prismaObject('Ad', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    adAccountId: t.exposeString('adAccountId', { nullable: false }),
    externalId: t.exposeString('externalId', { nullable: false }),
    name: t.exposeString('name', { nullable: true }),

    adAccount: t.relation('adAccount', { nullable: false }),
    insights: t.relatedConnection('insights', {
      cursor: 'id',
      nullable: false,
      // @ts-expect-error -- this is probably a bug in the type definitions
      edgesNullable: { list: false, items: true },
      nodeNullable: false,
      args: {
        dateFrom: t.arg({ type: 'Date', required: false }),
        dateTo: t.arg({ type: 'Date', required: false }),
        devices: t.arg({ type: [DeviceEnumDto], required: false }),
        publishers: t.arg({ type: [PublisherEnumDto], required: false }),
        positions: t.arg.stringList({ required: false }),
        highestFirst: t.arg.boolean({ defaultValue: true }),
        orderBy: t.arg({ type: InsightsColumnsOrderByDto, required: true, defaultValue: 'cpm_rel' }),
      },
      totalCount: true,
      query: (args, _ctx) => ({
        where: {
          date: { gte: args.dateFrom ?? undefined, lt: getTomorrowStartOfDay(args.dateTo) },
          device: { in: args.devices ?? undefined },
          publisher: { in: args.publishers ?? undefined },
          position: { in: args.positions ?? undefined },
        },
        orderBy: args.highestFirst ? { [args.orderBy]: 'desc' } : { [args.orderBy]: 'asc' },
      }),
    }),
  }),
});

export const InsightsOrderByDto = builder.enumType(DeviceEnum, {
  name: 'InsightsOrderBy',
});

export const DeviceEnumDto = builder.enumType(DeviceEnum, {
  name: 'DeviceEnum',
});

export const PublisherEnumDto = builder.enumType(PublisherEnum, {
  name: 'PublisherEnum',
});

export const InsightDto = builder.prismaObject('Insight', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    adId: t.exposeString('adId', { nullable: false }),

    date: t.expose('date', { type: 'Date', nullable: false }),
    impressions: t.expose('impressions', { type: 'BigInt', nullable: false }),
    spend: t.expose('spend', { type: 'BigInt', nullable: false }),
    device: t.expose('device', { type: DeviceEnumDto, nullable: false }),
    publisher: t.expose('publisher', { type: PublisherEnum, nullable: false }),
    position: t.exposeString('position', { nullable: false }),

    ad: t.relation('ad', { nullable: false }),
  }),
});

const OrderByDto = builder.enumType('OrderBy', {
  values: ['asc', 'desc'] as const,
});

const insightsIntervals: IntervalType[] = ['day', 'week', 'month', 'quarter'] as const;
const InsightsIntervalDto = builder.enumType('InsightsInterval', {
  values: insightsIntervals,
});

export const InsightsPositionDto = builder.enumType('InsightsPosition', {
  values: [
    'an_classic',
    'biz_disco_feed',
    'facebook_reels',
    'facebook_reels_overlay',
    'facebook_stories',
    'feed',
    'instagram_explore',
    'instagram_explore_grid_home',
    'instagram_profile_feed',
    'instagram_reels',
    'instagram_search',
    'instagram_stories',
    'instream_video',
    'marketplace',
    'messenger_inbox',
    'messenger_stories',
    'rewarded_video',
    'right_hand_column',
    'search',
    'video_feeds',
    'unknown',
  ] as const,
});

export const InsightsSearchFieldDto = builder.enumType(InsightsSearchField, { name: 'InsightsSearchField' });

export const InsightsSearchOperatorDto = builder.enumType(InsightsSearchOperator, { name: 'InsightsSearchOperator' });

export const InsightsSearchTermDto = builder.inputRef<InsightsSearchTerm>('InsightsSearchTerm').implement({
  fields: (t) => ({
    field: t.field({ type: InsightsSearchFieldDto, required: true }),
    operator: t.field({ type: InsightsSearchOperatorDto, required: true }),
    value: t.string({ required: true, validate: { minLength: 1 } }),
  }),
});

export const InsightsSearchExpressionDto = builder
  .inputRef<InsightsSearchExpression>('InsightsSearchExpression')
  .implement({
    fields: (t) => ({
      and: t.field({ type: [InsightsSearchExpressionDto], required: false }),
      or: t.field({ type: [InsightsSearchExpressionDto], required: false }),
      term: t.field({ type: InsightsSearchTermDto, required: false }),
    }),
  });

export const FilterInsightsInputDto = builder.inputRef<FilterInsightsInputType>('FilterInsightsInput').implement({
  fields: (t) => ({
    adAccountIds: t.stringList({ required: false }),
    adIds: t.stringList({ required: false }),
    dateFrom: t.field({ type: 'Date', required: false }),
    dateTo: t.field({ type: 'Date', required: false }),
    devices: t.field({ type: [DeviceEnumDto], required: false }),
    groupBy: t.field({ type: [InsightsColumnsGroupByDto], required: false }),
    integrations: t.field({ type: [IntegrationTypeDto], required: false }),
    interval: t.field({ type: InsightsIntervalDto, required: true }),
    order: t.field({ type: OrderByDto, defaultValue: 'desc' }),
    orderBy: t.field({ type: InsightsColumnsOrderByDto, required: true, defaultValue: 'cpm_rel' }),
    page: t.int({
      required: true,
      description: 'Starting at 1',
      defaultValue: 1,
      validate: { min: [1, { message: 'Minimum page is 1' }] },
    }),
    pageSize: t.int({
      required: true,
      defaultValue: 12,
      validate: {
        min: [1, { message: 'Minimum page is 1' }],
        max: [100, { message: 'Page size should not be more than 100' }],
      },
    }),
    positions: t.field({ type: [InsightsPositionDto], required: false }),
    publishers: t.field({ type: [PublisherEnumDto], required: false }),
    search: t.field({ type: InsightsSearchExpressionDto, required: false }),
  }),
  validate: [
    [
      (args) => !(args.dateFrom && args.dateTo && args.dateFrom.getTime() > args.dateTo.getTime()),
      { message: 'Date from should be less or equal to date to' },
    ],
    [
      (args) =>
        !(
          args.dateFrom &&
          args.dateTo &&
          args.interval === 'day' &&
          args.dateTo.getTime() - args.dateFrom.getTime() > 1000 * 60 * 60 * 24 * 90
        ),
      { message: 'Day intervals cannot be more than 90 days' },
    ],
    [
      (args) => {
        if (
          (args.orderBy === 'spend_rel' || args.orderBy === 'impressions_rel' || args.orderBy === 'cpm_rel') &&
          args.dateFrom &&
          args.dateTo
        ) {
          const dateFrom = new Date(args.dateFrom);
          const dateTo = new Date(args.dateTo);

          if (args.interval === 'day') {
            const minDayGapInMs = 2 * 24 * 60 * 60 * 1000;
            return dateTo.getTime() - dateFrom.getTime() >= minDayGapInMs;
          } else if (args.interval === 'week') {
            const dayOfWeekFrom = dateFrom.getUTCDay();
            const adjustedDateFrom = new Date(dateFrom);
            adjustedDateFrom.setUTCDate(dateFrom.getUTCDate() - (dayOfWeekFrom === 0 ? 6 : dayOfWeekFrom - 1));

            const dayOfWeekTo = dateTo.getUTCDay();
            const adjustedDateTo = new Date(dateTo);
            adjustedDateTo.setUTCDate(dateTo.getUTCDate() + (dayOfWeekTo === 0 ? 0 : 7 - dayOfWeekTo));

            const minWeekGapInMs = 2 * 7 * 24 * 60 * 60 * 1000;
            return adjustedDateTo.getTime() - adjustedDateFrom.getTime() >= minWeekGapInMs;
          } else if (args.interval === 'month') {
            const adjustedDateFrom = new Date(dateFrom);
            const adjustedDateTo = new Date(dateTo);

            const monthsDifference =
              (adjustedDateTo.getUTCFullYear() - adjustedDateFrom.getUTCFullYear()) * 12 +
              adjustedDateTo.getUTCMonth() -
              adjustedDateFrom.getUTCMonth();

            return monthsDifference >= 2;
          }
        }
        return true;
      },
      {
        message: 'Enter a valid date range',
      },
    ],
  ],
});

export const InsightsDatapointsInput = builder.inputType('InsightsDatapointsInput', {
  fields: (t) => ({
    adAccountId: t.string({ required: false }),
    adId: t.string({ required: false }),
    adSetId: t.string({ required: false }),
    campaignId: t.string({ required: false }),
    dateFrom: t.field({ type: 'Date', required: true }),
    dateTo: t.field({ type: 'Date', required: true }),
    device: t.field({ type: DeviceEnumDto, required: false }),
    interval: t.field({ type: InsightsIntervalDto, required: true }),
    position: t.field({ type: InsightsPositionDto, required: false }),
    publisher: t.field({ type: PublisherEnumDto, required: false }),
  }),
});

export type InsightsDatapointsInputType = typeof InsightsDatapointsInput.$inferInput;

export const getIntegrationStatus = (integration: Integration | undefined): IntegrationStatusEnum => {
  const EXPIRING_THRESHOLD_DAYS = 10;
  if (!integration) return IntegrationStatusEnum.NotConnected;
  if (integration.status === IntegrationStatus.REVOKED) return IntegrationStatusEnum.Revoked;
  if (integration.status === IntegrationStatus.ERRORED) return IntegrationStatusEnum.Errored;
  if (!integration.accessTokenExpiresAt) return IntegrationStatusEnum.Connected;
  if (
    (integration.refreshTokenExpiresAt && integration.refreshTokenExpiresAt < new Date()) ??
    (!integration.refreshTokenExpiresAt && integration.accessTokenExpiresAt < new Date())
  )
    return IntegrationStatusEnum.Expired;
  if (
    (integration.refreshTokenExpiresAt &&
      getDateDiffIn('day', new Date(), integration.refreshTokenExpiresAt) < EXPIRING_THRESHOLD_DAYS) ??
    (!integration.refreshTokenExpiresAt &&
      getDateDiffIn('day', new Date(), integration.accessTokenExpiresAt) < EXPIRING_THRESHOLD_DAYS)
  )
    return IntegrationStatusEnum.Expiring;
  return IntegrationStatusEnum.Connected;
};
