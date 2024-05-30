import { type CurrencyEnum, type DeviceEnum, type Insight, prisma, Prisma, type PublisherEnum } from '@repo/database';
import { Kind } from 'graphql/language';
import { isAError } from '@repo/utils';
import { logger } from '@repo/logger';
import { parse as htmlParse } from 'node-html-parser';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { iFramePerInsight } from '@repo/channel';
import { getIFrameAdFormat } from '@repo/channel-utils';
import * as changeCase from 'change-case';
import { groupBy as groupByUtil, uniqueBy } from '../../utils/data-object-utils';
import { builder } from '../builder';
import { invokeChannelIngress } from '../../utils/lambda-utils';
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

builder.queryFields((t) => ({
  lastThreeMonthsAds: t.withAuth({ authenticated: true }).prismaField({
    type: [AdDto],
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
  insights: t.withAuth({ authenticated: true }).field({
    type: GroupedInsightsDto,
    args: {
      filter: t.arg({ type: FilterInsightsInput, required: true }),
    },
    resolve: async (_root, args, ctx, info) => {
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
        adName?: string;
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

      if (
        args.filter.groupBy?.includes('adId') &&
        info.fieldNodes.some((f) =>
          f.selectionSet?.selections.some(
            (s) =>
              s.kind === Kind.FIELD &&
              s.name.value === 'edges' &&
              s.selectionSet?.selections.some((sel) => sel.kind === Kind.FIELD && sel.name.value === 'adName'),
          ),
        )
      ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it is checked above
        const uniqueAdIds = uniqueBy(ret, (edge) => edge.adId!);
        const adNamesMap = await prisma.ad
          .findMany({
            select: { id: true, name: true },
            where: { id: { in: Array.from(uniqueAdIds) } },
          })
          .then((ads) => new Map(ads.map((ad) => [ad.id, ad.name])));
        ret.forEach((edge) => {
          edge.adName = edge.adName ? adNamesMap.get(edge.adName) : undefined;
        });
      }

      if (
        args.filter.groupBy?.includes('adAccountId') &&
        info.fieldNodes.some((f) =>
          f.selectionSet?.selections.some(
            (s) =>
              s.kind === Kind.FIELD &&
              s.name.value === 'edges' &&
              s.selectionSet?.selections.some((sel) => sel.kind === Kind.FIELD && sel.name.value === 'adAccountName'),
          ),
        )
      ) {
        const adAccountNamesMap = await prisma.adAccount
          .findMany({
            select: { id: true, name: true },
            where: {
              id: { in: Array.from(new Set(ret.map((e) => e.adAccountId))).flatMap((i) => i ?? []) },
            },
          })
          .then((ads) => new Map(ads.map((ad) => [ad.id, ad.name])));
        ret.forEach((edge) => {
          edge.adAccountName = edge.adAccountId ? adAccountNamesMap.get(edge.adAccountId) : undefined;
        });
      }

      return {
        totalCount: await totalElementsP,
        hasNext,
        page: args.filter.page,
        pageSize: args.filter.pageSize,
        edges: ret,
      };
    },
  }),
  insightDatapoints: t.withAuth({ authenticated: true }).field({
    type: [InsightsDatapointsDto],
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
}));

builder.mutationFields((t) => ({
  refreshData: t.withAuth({ isAdmin: true }).field({
    type: 'Boolean',
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
    totalCount: t.int(),
    hasNext: t.boolean(),
    page: t.int(),
    pageSize: t.int(),
  }),
});

const GroupedInsightsDto = builder.simpleObject('GroupedInsight', {
  interfaces: [PaginationDto],
  fields: (t) => ({
    edges: t.field({ type: [GroupedInsightDto] }),
  }),
});

const iFrameSchema = z.object({
  title: z.string().optional(),
  src: z.string(),
  width: z.string(),
  height: z.string(),
  scrolling: z.string().optional(),
});

type IFrameType = z.infer<typeof iFrameSchema>;

const IFrameDTO = builder.objectRef<IFrameType>('IFrame').implement({
  fields: (t) => ({
    src: t.exposeString('src'),
    width: t.exposeString('width'),
    height: t.exposeString('height'),
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
      adAccountName: t.string({ nullable: true }),
      adName: t.string({ nullable: true }),
      currency: t.field({ type: CurrencyEnumDto, nullable: false }),
      device: t.field({ type: DeviceEnumDto, nullable: true }),
      publisher: t.field({ type: PublisherEnumDto, nullable: true }),
      position: t.string({ nullable: true }),
    }),
  },
  (t) => ({
    iFrame: t.field({
      type: IFrameDTO,
      nullable: true,
      resolve: async (root, _args, _ctx, _info) => {
        if (!root.adId) return null;
        const format = getIFrameAdFormat(root.publisher, root.device, root.position);
        if (!format) {
          logger.error(
            `No format found for publisher: ${root.publisher ?? 'unknown'}, device: ${root.device ?? 'unknown'}, position: ${root.position ?? 'unknown'}`,
          );
          return null;
        }
        const iFrame = await iFramePerInsight.getValue(
          {
            adId: root.adId,
            publisher: root.publisher ?? undefined,
            format,
          },
          {
            adId: root.adId,
            publisher: root.publisher ?? undefined,
            position: root.position ?? undefined,
            device: root.device ?? undefined,
          },
        );
        if (isAError(iFrame)) return null;
        const htmlRoot = htmlParse(iFrame);
        const attributes = htmlRoot.querySelector('iframe')?.attributes;
        const iFrameData = iFrameSchema.safeParse(attributes);
        if (!iFrameData.success) throw new GraphQLError('Invalid iFrame data found');
        return iFrameData.data;
      },
    }),
  }),
);

const InsightsDatapointsDto = builder.simpleObject('InsightsDatapoints', {
  fields: (t) => ({
    spend: t.field({ type: 'Int', nullable: false }),
    impressions: t.field({ type: 'Int', nullable: false }),
    cpm: t.field({ type: 'Int', nullable: false }),
    date: t.field({ type: 'Date', nullable: false }),
  }),
});
