import { type CurrencyEnum, type DeviceEnum, type Insight, prisma, Prisma, type PublisherEnum } from '@repo/database';
import { Kind } from 'graphql/language';
import { FireAndForget, isAError } from '@repo/utils';
import {
  type ChannelIFrame,
  getInsightsCache,
  iFramePerInsight,
  invokeChannelIngress,
  setInsightsCache,
} from '@repo/channel';
import * as changeCase from 'change-case';
import { groupBy as groupByUtil } from '../../utils/data-object-utils';
import { builder } from '../builder';
import { groupedInsights, insightsDatapoints } from '../../utils/insights-query-builder';
import {
  AdDto,
  CurrencyEnumDto,
  DeviceEnumDto,
  FilterInsightsInput,
  InsightsDatapointsInput,
  PublisherEnumDto,
} from './integration-types';
import InsightWhereInput = Prisma.InsightWhereInput;
import InsightScalarFieldEnum = Prisma.InsightScalarFieldEnum;

const fireAndForget = new FireAndForget();

builder.queryFields((t) => ({
  lastThreeMonthsAds: t.withAuth({ isInOrg: true }).prismaField({
    type: [AdDto],
    nullable: false,
    resolve: async (query, _root, _args, ctx) => {
      return await prisma.ad.findMany({
        ...query,
        distinct: 'id',
        where: {
          adAccount: { integration: { organizationId: ctx.organizationId } },
          insights: {
            some: {
              date: { gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) },
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
      filter: t.arg({ type: FilterInsightsInput, required: true }),
    },
    resolve: async (_root, args, ctx, info) => {
      const redisValue = await getInsightsCache<GroupedInsightsType>(ctx.organizationId, args.filter);
      if (redisValue) return redisValue;

      const where: InsightWhereInput = {
        adAccountId: { in: args.filter.adAccountIds ?? undefined },
        adId: { in: args.filter.adIds ?? undefined },
        device: { in: args.filter.devices ?? undefined },
        publisher: { in: args.filter.publishers ?? undefined },
        position: { in: args.filter.positions ?? undefined },
        ad: { adAccount: { integration: { organizationId: ctx.organizationId } } },
      };

      const groupBy: InsightScalarFieldEnum[] = [...(args.filter.groupBy ?? []), 'currency'];

      const insightsRaw: Record<string, never>[] = await prisma.$queryRawUnsafe(
        groupedInsights(args.filter, ctx.organizationId),
      );
      const insightsTransformed = insightsRaw.map((obj) => {
        const newObj: Record<string, never> = {};
        for (const key in obj) {
          if (key === 'interval_start') {
            newObj.date = obj[key];
          } else {
            newObj[changeCase.camelCase(key)] = obj[key];
          }
        }
        return newObj;
      }) as unknown as (Insight & { cpm: number })[];

      const ret: {
        id: string;
        adAccountId?: string;
        adAccountName?: string;
        adId?: string;
        adName?: string | null;
        position?: string;
        device?: DeviceEnum;
        publisher?: PublisherEnum;
        currency: CurrencyEnum;
        datapoints: { spend: number; impressions: number; date: Date; cpm: number }[];
      }[] = [];
      const insightsGrouped = groupByUtil(insightsTransformed, (insight) => {
        return groupBy.map((group) => insight[group]).join('-');
      });
      for (const [_, value] of insightsGrouped) {
        if (value.length > 0) {
          const valueWithoutDatapoints = { ...value[0], date: undefined, impressions: undefined, spend: undefined };
          ret.push({
            ...valueWithoutDatapoints,
            id: groupBy.map((group) => value[0][group]).join('-'),
            datapoints: value.map((v) => ({ spend: v.spend, impressions: v.impressions, date: v.date, cpm: v.cpm })),
          });
        }
      }

      const hasNext = ret.length > args.filter.pageSize;
      if (hasNext) ret.pop();

      // Only if totalCount is requested, we need to fetch all elements
      const totalElementsP = info.fieldNodes.some((f) =>
        f.selectionSet?.selections.some((s) => s.kind === Kind.FIELD && s.name.value === 'totalCount'),
      )
        ? prisma.insight
            .findMany({
              select: { id: true },
              distinct: groupBy,
              where,
            })
            .then((ins) => ins.length)
        : 0;

      const retVal = {
        totalCount: await totalElementsP,
        hasNext,
        page: args.filter.page,
        pageSize: args.filter.pageSize,
        edges: ret,
      };
      fireAndForget.add(() => setInsightsCache(ctx.organizationId, args.filter, retVal));
      return retVal;
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
        where: { id: args.adId, adAccount: { integration: { organizationId: ctx.organizationId } } },
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
      await invokeChannelIngress({ initial: args.initial, integrationIds: args.integrationIds ?? undefined });
      return true;
    },
  }),
}));

export const PaginationDto = builder.simpleInterface('Pagination', {
  fields: (t) => ({
    totalCount: t.int({ nullable: false }),
    hasNext: t.boolean({ nullable: false }),
    page: t.int({ nullable: false }),
    pageSize: t.int({ nullable: false }),
  }),
});

const GroupedInsightsDto = builder.simpleObject('GroupedInsight', {
  interfaces: [PaginationDto],
  fields: (t) => ({
    edges: t.field({ type: [GroupedInsightDto], nullable: false }),
  }),
});
type GroupedInsightsType = typeof GroupedInsightsDto.$inferType;

const IFrameDTO = builder.objectRef<ChannelIFrame>('IFrame').implement({
  fields: (t) => ({
    src: t.exposeString('src', { nullable: false }),
    width: t.exposeInt('width', { nullable: false }),
    height: t.exposeInt('height', { nullable: false }),
  }),
});

const GroupedInsightDto = builder.simpleObject(
  'GroupedInsights',
  {
    fields: (t) => ({
      datapoints: t.field({ type: [InsightsDatapointsDto], nullable: false }),
      id: t.string({ nullable: false }),
      adId: t.string({ nullable: true }),
      adAccountId: t.string({ nullable: true }),
      currency: t.field({ type: CurrencyEnumDto, nullable: false }),
      device: t.field({ type: DeviceEnumDto, nullable: true }),
      publisher: t.field({ type: PublisherEnumDto, nullable: true }),
      position: t.string({ nullable: true }),
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
    iFrame: t.field({
      type: IFrameDTO,
      nullable: true,
      resolve: async (root, _args, _ctx, _info) => {
        if (!root.adId) return null;
        const iFrame = await iFramePerInsight.getValue(
          {
            adId: root.adId,
            publisher: root.publisher ?? undefined,
            position: root.position ?? undefined,
            device: root.device ?? undefined,
          },
          {
            adId: root.adId,
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
    spend: t.field({ type: 'Int', nullable: false, description: 'In Cents' }),
    impressions: t.field({ type: 'Int', nullable: false }),
    cpm: t.field({ type: 'Int', nullable: true }),
    date: t.field({ type: 'Date', nullable: false }),
  }),
});
