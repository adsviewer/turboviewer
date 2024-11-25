import { IntegrationTypeEnum, prisma } from '@repo/database';
import { isAError } from '@repo/utils';
import {
  getInsightsHelper,
  type GroupedInsightsWithEdges,
  iFramePerInsight,
  IFrameTypeEnum,
  type IFrameWithType,
  invokeChannelIngress,
} from '@repo/channel';
import { builder } from '../builder';
import { insightsDatapoints } from '../../utils/insights-datapoint-query-builder';
import {
  AdDto,
  CurrencyEnumDto,
  DeviceEnumDto,
  FilterInsightsInputDto,
  InsightsDatapointsInput,
  PublisherEnumDto,
} from './integration-types';

builder.queryFields((t) => ({
  lastThreeMonthsAds: t.withAuth({ isInOrg: true }).prismaField({
    type: [AdDto],
    nullable: false,
    resolve: async (query, _root, _args, ctx) => {
      return await prisma.ad.findMany({
        ...query,
        distinct: 'id',
        where: {
          adAccount: {
            adAccountIntegrations: {
              some: {
                Integration: {
                  organizationId: ctx.organizationId,
                },
              },
            },
          },
          insights: {
            some: {
              date: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
              },
            },
          },
        },
      });
    },
  }),
  insights: t.withAuth({ isInOrg: true }).field({
    type: GroupedInsightsDto,
    nullable: false,
    args: {
      filter: t.arg({ type: FilterInsightsInputDto, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      return getInsightsHelper(args.filter, ctx.organizationId, ctx.acceptedLocale);
    },
  }),

  insightDatapoints: t.withAuth({ isInOrg: true }).field({
    type: [InsightsDatapointsDto],
    nullable: false,
    args: {
      args: t.arg({ type: InsightsDatapointsInput, required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const datapoints: (typeof InsightsDatapointsDto.$inferType)[] = await prisma.$queryRawUnsafe(
        insightsDatapoints(args.args, ctx.organizationId),
      );
      return datapoints;
    },
  }),

  insightIFrame: t.withAuth({ isInOrg: true }).field({
    type: IFrameDTO,
    nullable: true,
    args: {
      adId: t.arg.string({ required: true }),
      publisher: t.arg({ type: PublisherEnumDto, required: false }),
      device: t.arg({ type: DeviceEnumDto, required: false }),
      position: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const ad = await prisma.ad.findUnique({
        where: { id: args.adId },
        include: {
          adAccount: {
            include: {
              adAccountIntegrations: {
                where: {
                  Integration: {
                    organizationId: ctx.organizationId,
                  },
                },
              },
            },
          },
        },
      });
      if (!ad) return null;
      const iFrame = await iFramePerInsight.getValue(
        {
          adId: args.adId,
          publisher: args.publisher ?? undefined,
          device: args.device ?? undefined,
          position: args.position ?? undefined,
        },
        {
          adId: args.adId,
          publisher: args.publisher ?? undefined,
          position: args.position ?? undefined,
          device: args.device ?? undefined,
        },
      );
      if (isAError(iFrame)) return null;
      return iFrame;
    },
  }),
}));

builder.mutationFields((t) => ({
  refreshData: t.withAuth({ isAdmin: true }).field({
    type: 'Boolean',
    nullable: false,
    args: {
      integrationIds: t.arg.stringList({ required: false }),
      initial: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      await invokeChannelIngress(args.initial, args.integrationIds ?? undefined);
      return true;
    },
  }),
  fillCreatives: t.withAuth({ isAdmin: true }).field({
    type: 'Boolean',
    nullable: false,
    args: {
      integrationIds: t.arg.stringList({ required: false }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      const limit = 500;
      let offset = 0;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition -- temporary
      while (true) {
        const ads = await prisma.ad.findMany({
          take: limit,
          skip: offset,
          where: {
            ...(args.integrationIds && {
              adAccount: {
                adAccountIntegrations: {
                  some: {
                    integrationId: { in: args.integrationIds },
                  },
                },
              },
            }),
            creativeId: null,
          },
        });
        await prisma.creative.createMany({
          data: ads.map((ad) => ({
            id: ad.id,
            name: ad.name ?? '',
            adAccountId: ad.adAccountId,
            externalId: ad.externalId,
          })),
        });
        for (const ad of ads) {
          await prisma.ad.update({
            where: { id: ad.id },
            data: { creativeId: ad.id },
          });
        }
        if (ads.length < limit) break;
        offset += limit;
      }
      return true;
    },
  }),
}));

export const PaginationDto = builder.simpleInterface('Pagination', {
  fields: (t) => ({
    hasNext: t.boolean({ nullable: false }),
    page: t.int({ nullable: false }),
    pageSize: t.int({ nullable: false }),
  }),
});

const GroupedInsightsDto = builder.objectRef<GroupedInsightsWithEdges>('GroupedInsights').implement({
  interfaces: [PaginationDto],
  fields: (t) => ({
    edges: t.expose('edges', { type: [GroupedInsightDto], nullable: false }),
    hasNext: t.exposeBoolean('hasNext', { nullable: false }),
    page: t.exposeInt('page', { nullable: false }),
    pageSize: t.exposeInt('pageSize', { nullable: false }),
  }),
});

const IFrameTypeEnumDTO = builder.enumType(IFrameTypeEnum, {
  name: 'IFrameType',
});

const IFrameDTO = builder.objectRef<IFrameWithType>('IFrame').implement({
  fields: (t) => ({
    src: t.exposeString('src', { nullable: false }),
    width: t.exposeInt('width', { nullable: false }),
    height: t.exposeInt('height', { nullable: false }),
    type: t.expose('type', { type: IFrameTypeEnumDTO, nullable: false }),
  }),
});

const GroupedInsightDto = builder.simpleObject(
  'GroupedInsight',
  {
    fields: (t) => ({
      datapoints: t.field({ type: [InsightsDatapointsDto], nullable: false }),
      id: t.string({ nullable: false }),
      adId: t.string({ nullable: true }),
      adAccountId: t.string({ nullable: true }),
      adSetId: t.string({ nullable: true }),
      campaignId: t.string({ nullable: true }),
      creativeId: t.string({ nullable: true }),
      currency: t.field({ type: CurrencyEnumDto, nullable: false }),
      device: t.field({ type: DeviceEnumDto, nullable: true }),
      publisher: t.field({ type: PublisherEnumDto, nullable: true }),
      position: t.string({ nullable: true }),
      integration: t.field({ type: IntegrationTypeEnum, nullable: true }),
    }),
  },
  (t) => ({
    adAccountName: t.field({
      type: 'String',
      nullable: true,
      resolve: async (root, _args, _ctx, _info) => {
        if (root.adAccountId) {
          const { name } = await prisma.adAccount.findUniqueOrThrow({ where: { id: root.adAccountId } });
          return name;
        }
        if (root.adId) {
          const { adAccount } = await prisma.ad.findUniqueOrThrow({
            include: { adAccount: true },
            where: { id: root.adId },
          });
          return adAccount.name;
        }
        return null;
      },
    }),
    adName: t.field({
      type: 'String',
      nullable: true,
      resolve: async (root, _args, _ctx, _info) => {
        if (root.adId) {
          const { name } = await prisma.ad.findUniqueOrThrow({ where: { id: root.adId } });
          return name;
        }
        return null;
      },
    }),
    creativeName: t.field({
      type: 'String',
      nullable: true,
      resolve: async (root, _args, _ctx, _info) =>
        root.creativeId ? (await prisma.creative.findUniqueOrThrow({ where: { id: root.creativeId } })).name : null,
    }),
    adSetName: t.field({
      type: 'String',
      nullable: true,
      resolve: async (root, _args, _ctx, _info) => {
        if (root.adSetId) {
          const { name } = await prisma.adSet.findUniqueOrThrow({ where: { id: root.adSetId } });
          return name;
        }
        return null;
      },
    }),
    campaignName: t.field({
      type: 'String',
      nullable: true,
      resolve: async (root, _args, _ctx, _info) => {
        if (root.campaignId) {
          const { name } = await prisma.campaign.findUniqueOrThrow({ where: { id: root.campaignId } });
          return name;
        }
        return null;
      },
    }),
    iFrame: t.field({
      type: IFrameDTO,
      nullable: true,
      resolve: async (root, _args, _ctx, _info) => {
        if (!root.adId && !root.creativeId) return null;
        const adId = root.adId
          ? root.adId
          : (await prisma.ad.findFirstOrThrow({ where: { creativeId: root.creativeId } })).id;
        const iFrame = await iFramePerInsight.getValue(
          {
            adId,
            publisher: root.publisher ?? undefined,
            position: root.position ?? undefined,
            device: root.device ?? undefined,
          },
          {
            adId,
            publisher: root.publisher ?? undefined,
            position: root.position ?? undefined,
            device: root.device ?? undefined,
          },
        );
        if (isAError(iFrame)) return null;
        return iFrame;
      },
    }),
  }),
);

const InsightsDatapointsDto = builder.simpleObject('InsightsDatapoints', {
  fields: (t) => ({
    spend: t.field({ type: 'BigInt', nullable: false, description: 'In Cents' }),
    spendUsd: t.field({ type: 'BigInt', nullable: true, description: 'In Cents' }),
    impressions: t.field({ type: 'BigInt', nullable: false }),
    clicks: t.field({ type: 'BigInt', nullable: true }),
    cpm: t.float({ nullable: true }),
    cpc: t.float({ nullable: true }),
    date: t.field({ type: 'Date', nullable: false }),
  }),
});
