import {
  CurrencyEnum,
  DeviceEnum,
  type Insight,
  type Integration,
  IntegrationTypeEnum,
  prisma,
  PublisherEnum,
} from '@repo/database';
import { MetaError } from '@repo/channel-utils';
import { getEndOfDay, type IntervalType } from '@repo/utils';
import type { InputShapeFromFields } from '@pothos/core';
import { builder } from '../builder';
import { ErrorInterface } from '../errors';
import { type ChannelInitialProgressPayload } from '../pubsub';
import type { GraphQLContext } from '../../context';
import { getRootOrganizationId } from '../../contexts/organization';

export enum IntegrationStatusEnum {
  ComingSoon = 'ComingSoon',
  NotConnected = 'NotConnected',
  Expired = 'Expired',
  Connected = 'Connected',
  Revoked = 'Revoked',
}

export const ShouldConnectIntegrationStatuses = [
  IntegrationStatusEnum.NotConnected,
  IntegrationStatusEnum.Expired,
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

    organization: t.relation('organization', { nullable: false }),
    adAccounts: t.relation('adAccounts', {
      nullable: false,
      ...offspringOrgFieldProps,
      query: (args, ctx) =>
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

export const CurrencyEnumDto = builder.enumType(CurrencyEnum, {
  name: 'CurrencyEnum',
});

export const AdAccountDto = builder.prismaObject('AdAccount', {
  authScopes: { isInOrg: true },
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    integrationId: t.exposeString('integrationId', { nullable: false }),
    externalId: t.exposeString('externalId', { nullable: false }),

    type: t.expose('type', { type: IntegrationTypeDto, nullable: false }),
    currency: t.expose('currency', { type: CurrencyEnumDto, nullable: false }),
    name: t.exposeString('name', { nullable: false }),
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
    integration: t.relation('integration', { nullable: false }),
    organizations: t.relation('organizations', {
      nullable: false,
      query: (args, ctx) =>
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

const insightsColumnsOrderBy = [
  'spend_abs',
  'impressions_abs',
  'cpm_abs',
  'spend_rel',
  'impressions_rel',
  'cpm_rel',
] as const;
export const InsightsColumnsOrderByDto = builder.enumType('InsightsColumnsOrderBy', {
  values: insightsColumnsOrderBy,
});

export type InsightsPossibleGrouping = 'adAccountId' | 'adId' | 'device' | 'position' | 'publisher';
export type InsightsColumnsGroupByType = keyof Pick<Insight, InsightsPossibleGrouping>;
const insightsColumnsGroupBy: InsightsColumnsGroupByType[] = [
  'adAccountId',
  'adId',
  'device',
  'position',
  'publisher',
] as const;
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
          date: { gte: args.dateFrom ?? undefined, lte: getEndOfDay(args.dateTo) },
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
    impressions: t.exposeInt('impressions', { nullable: false }),
    spend: t.exposeInt('spend', { nullable: false }),
    device: t.expose('device', { type: DeviceEnumDto, nullable: false }),
    publisher: t.expose('publisher', { type: PublisherEnum, nullable: false }),
    position: t.exposeString('position', { nullable: false }),

    ad: t.relation('ad', { nullable: false }),
  }),
});

const OrderByDto = builder.enumType('OrderBy', {
  values: ['asc', 'desc'] as const,
});

const insightsIntervals: IntervalType[] = ['day', 'week', 'month'] as const;
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

export const FilterInsightsInput = builder.inputType('FilterInsightsInput', {
  fields: (t) => ({
    adAccountIds: t.stringList({ required: false }),
    adIds: t.stringList({ required: false }),
    dateFrom: t.field({ type: 'Date', required: false }),
    dateTo: t.field({ type: 'Date', required: false }),
    dataPointsPerInterval: t.int({ required: true, defaultValue: 3 }),
    devices: t.field({ type: [DeviceEnumDto], required: false }),
    groupBy: t.field({ type: [InsightsColumnsGroupByDto], required: false }),
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
  }),
});

export const InsightsDatapointsInput = builder.inputType('InsightsDatapointsInput', {
  fields: (t) => ({
    adAccountId: t.string({ required: false }),
    adId: t.string({ required: false }),
    dateFrom: t.field({ type: 'Date', required: true }),
    dateTo: t.field({ type: 'Date', required: true }),
    device: t.field({ type: DeviceEnumDto, required: false }),
    interval: t.field({ type: InsightsIntervalDto, required: true }),
    position: t.field({ type: InsightsPositionDto, required: false }),
    publisher: t.field({ type: PublisherEnumDto, required: false }),
  }),
});

export type FilterInsightsInputType = typeof FilterInsightsInput.$inferInput;
export type InsightsDatapointsInputType = typeof InsightsDatapointsInput.$inferInput;
