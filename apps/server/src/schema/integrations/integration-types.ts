import { CurrencyEnum, DeviceEnum, type Insight, IntegrationTypeEnum, PublisherEnum } from '@repo/database';
import { MetaError } from '@repo/channel-utils';
import { getEndOfDay } from '@repo/utils';
import { builder } from '../builder';
import { ErrorInterface } from '../errors';
import { type ChannelInitialProgressPayload } from '../pubsub';

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
    type: t.field({ type: IntegrationTypeDto }),
    status: t.field({ type: IntegrationStatusDto }),
    authUrl: t.string({ nullable: true }),
  }),
});

export const IntegrationDto = builder.prismaObject('Integration', {
  fields: (t) => ({
    id: t.exposeID('id'),
    organizationId: t.exposeString('organizationId'),

    type: t.expose('type', { type: IntegrationTypeDto }),
    externalId: t.exposeString('externalId', { nullable: true }),

    accessTokenExpiresAt: t.expose('accessTokenExpiresAt', { type: 'Date', nullable: true }),
    refreshTokenExpiresAt: t.expose('refreshTokenExpiresAt', { type: 'Date', nullable: true }),

    organization: t.relation('organization'),
    adAccounts: t.relation('adAccounts', {
      args: {
        currency: t.arg({ type: CurrencyEnumDto, required: false }),
      },
      query: (args, _ctx) => ({
        where: {
          currency: args.currency ?? undefined,
        },
      }),
    }),
  }),
});

builder.objectType(MetaError, {
  name: 'MetaError',
  interfaces: [ErrorInterface],
  fields: (t) => ({
    code: t.exposeInt('code'),
    errorSubCode: t.exposeInt('errorSubCode'),
    fbTraceId: t.exposeString('fbTraceId'),
  }),
});

export const ChannelInitialProgressPayloadDto = builder
  .objectRef<ChannelInitialProgressPayload>('ChannelInitialProgressPayload')
  .implement({
    fields: (t) => ({
      channel: t.expose('channel', { type: IntegrationTypeDto }),
      progress: t.exposeFloat('progress'),
    }),
  });

export const CurrencyEnumDto = builder.enumType(CurrencyEnum, {
  name: 'CurrencyEnum',
});

export const AdAccountDto = builder.prismaObject('AdAccount', {
  fields: (t) => ({
    id: t.exposeID('id'),
    integrationId: t.exposeString('integrationId'),
    externalId: t.exposeString('externalId'),

    currency: t.expose('currency', { type: CurrencyEnumDto }),
    name: t.exposeString('name'),
    updatedAt: t.expose('updatedAt', { type: 'Date' }),
    createdAt: t.expose('createdAt', { type: 'Date' }),

    integration: t.relation('integration'),
    advertisements: t.relatedConnection('advertisements', { cursor: 'id' }),
  }),
});

type InsightsColumnsOrderByType = keyof Pick<Insight, 'spend' | 'impressions'>;
const insightsColumnsOrderBy: InsightsColumnsOrderByType[] = ['spend', 'impressions'] as const;
export const InsightsColumnsOrderByDto = builder.enumType('InsightsColumnsOrderBy', {
  values: insightsColumnsOrderBy,
});

type InsightsColumnsGroupByType = keyof Pick<
  Insight,
  'adAccountId' | 'adId' | 'date' | 'device' | 'position' | 'publisher'
>;
const insightsColumnsGroupBy: InsightsColumnsGroupByType[] = [
  'adAccountId',
  'adId',
  'date',
  'device',
  'position',
  'publisher',
] as const;
export const InsightsColumnsGroupByDto = builder.enumType('InsightsColumnsGroupBy', {
  values: insightsColumnsGroupBy,
});

export const AdDto = builder.prismaObject('Ad', {
  fields: (t) => ({
    id: t.exposeID('id'),
    adAccountId: t.exposeString('adAccountId'),
    externalId: t.exposeString('externalId'),
    name: t.exposeString('name'),

    adAccount: t.relation('adAccount'),
    insights: t.relatedConnection('insights', {
      cursor: 'id',
      args: {
        dateFrom: t.arg({ type: 'Date', required: false }),
        dateTo: t.arg({ type: 'Date', required: false }),
        devices: t.arg({ type: [DeviceEnumDto], required: false }),
        publishers: t.arg({ type: [PublisherEnumDto], required: false }),
        positions: t.arg.stringList({ required: false }),
        highestFirst: t.arg.boolean({ defaultValue: true }),
        orderBy: t.arg({ type: InsightsColumnsOrderByDto, required: true, defaultValue: 'spend' }),
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
    id: t.exposeID('id'),
    adId: t.exposeString('adId'),

    date: t.expose('date', { type: 'Date' }),
    impressions: t.exposeInt('impressions'),
    spend: t.exposeInt('spend'),
    device: t.expose('device', { type: DeviceEnumDto }),
    publisher: t.expose('publisher', { type: PublisherEnum }),
    position: t.exposeString('position'),

    ad: t.relation('ad'),
  }),
});
