import { prisma, Prisma } from '@repo/database';
import { Kind } from 'graphql/language';
import { isAError } from '@repo/utils';
import { logger } from '@repo/logger';
import { parse as htmlParse } from 'node-html-parser';
import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { builder } from '../builder';
import { getEndofDay } from '../../utils/date-utils';
import { uniqueBy } from '../../utils/data-object-utils';
import { iFramePerInsight } from '../../contexts/channels/iframe-helper';
import { getIFrameAdFormat } from '../../contexts/channels/fb/iframe-fb-helper';
import { refreshData, refreshDataOf } from '../../contexts/channels/data-refresh';
import { decryptTokens } from '../../contexts/channels/integration-util';
import {
  AdDto,
  CurrencyEnumDto,
  DeviceEnumDto,
  InsightsColumnsGroupByDto,
  InsightsColumnsOrderByDto,
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
      adAccountIds: t.arg.stringList({ required: false }),
      adIds: t.arg.stringList({ required: false }),
      dateFrom: t.arg({ type: 'Date', required: false }),
      dateTo: t.arg({ type: 'Date', required: false }),
      devices: t.arg({ type: [DeviceEnumDto], required: false }),
      groupBy: t.arg({ type: [InsightsColumnsGroupByDto], required: false }),
      order: t.arg.string({
        defaultValue: 'desc',
        validate: {
          regex: [/^(?:desc|asc)$/, { message: 'Order can be only asc(ascending) or desc(descending)' }],
        },
      }),
      orderBy: t.arg({ type: InsightsColumnsOrderByDto, required: true, defaultValue: 'spend' }),
      page: t.arg.int({
        required: true,
        description: 'Starting at 1',
        defaultValue: 1,
        validate: { min: [1, { message: 'Minimum page is 1' }] },
      }),
      pageSize: t.arg.int({
        required: true,
        defaultValue: 12,
        validate: { max: [100, { message: 'Page size should not be more than 100' }] },
      }),
      positions: t.arg.stringList({ required: false }),
      publishers: t.arg({ type: [PublisherEnumDto], required: false }),
    },
    resolve: async (_root, args, ctx, info) => {
      const where: InsightWhereInput = {
        adAccountId: { in: args.adAccountIds ?? undefined },
        adId: { in: args.adIds ?? undefined },
        date: { gte: args.dateFrom ?? undefined, lte: getEndofDay(args.dateTo) },
        device: { in: args.devices ?? undefined },
        publisher: { in: args.publishers ?? undefined },
        position: { in: args.positions ?? undefined },
        ad: { adAccount: { integration: { organizationId: ctx.organizationId } } },
      };

      const groupBy: InsightScalarFieldEnum[] = [...(args.groupBy ?? []), 'currency'];

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

      const groupedEdges = await prisma.insight
        .groupBy({
          by: groupBy,
          _sum: {
            spend: true,
            impressions: true,
          },
          where,
          orderBy: { _sum: { [args.orderBy]: args.order } },
          take: args.pageSize,
          skip: args.page ? (args.page - 1) * args.pageSize : undefined,
        })
        .then((grouped) =>
          grouped.map((group) => ({
            ...group,
            spend: group._sum.spend ?? 0,
            impressions: group._sum.impressions ?? 0,
          })),
        );

      if (
        args.groupBy?.includes('adId') &&
        info.fieldNodes.some((f) =>
          f.selectionSet?.selections.some(
            (s) =>
              s.kind === Kind.FIELD &&
              s.name.value === 'edges' &&
              s.selectionSet?.selections.some((sel) => sel.kind === Kind.FIELD && sel.name.value === 'adName'),
          ),
        )
      ) {
        const uniqueAdIds = uniqueBy(groupedEdges, (edge) => edge.adId);
        const adNamesMap = await prisma.ad
          .findMany({
            select: { id: true, name: true },
            where: { id: { in: Array.from(uniqueAdIds) } },
          })
          .then((ads) => new Map(ads.map((ad) => [ad.id, ad.name])));
        groupedEdges.forEach((edge) => ({ ...edge, adName: adNamesMap.get(edge.adId) }));
      }

      if (
        args.groupBy?.includes('adAccountId') &&
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
              id: { in: Array.from(new Set(groupedEdges.map((e) => e.adAccountId))).flatMap((i) => i ?? []) },
            },
          })
          .then((ads) => new Map(ads.map((ad) => [ad.id, ad.name])));
        groupedEdges.forEach((edge) => ({
          ...edge,
          adAccountName: edge.adAccountId ? adAccountNamesMap.get(edge.adAccountId) : 'no name',
        }));
      }

      return { totalCount: await totalElementsP, edges: groupedEdges };
    },
  }),
}));

builder.mutationFields((t) => ({
  refreshData: t.withAuth({ isAdmin: true }).field({
    type: 'Boolean',
    args: {
      integrationIds: t.arg.stringList({ required: false }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      if (args.integrationIds) {
        const integrations = await prisma.integration
          .findMany({
            where: { id: { in: args.integrationIds } },
          })
          .then((ints) => ints.map(decryptTokens).flatMap((integration) => integration ?? []));
        for (const integration of integrations) {
          await refreshDataOf(integration);
        }
      } else {
        await refreshData();
      }
      return true;
    },
  }),
}));

export const PaginationDto = builder.simpleInterface('Pagination', {
  fields: (t) => ({
    totalCount: t.int(),
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
      adId: t.string({ nullable: true }),
      adAccountId: t.string({ nullable: true }),
      adAccountName: t.string({ nullable: true }),
      adName: t.string({ nullable: true }),

      // TODO this should be non nullable
      currency: t.field({ type: CurrencyEnumDto, nullable: true }),

      date: t.field({ type: 'Date', nullable: true }),
      device: t.field({ type: DeviceEnumDto, nullable: true }),
      publisher: t.field({ type: PublisherEnumDto, nullable: true }),
      position: t.string({ nullable: true }),
      spend: t.int({ nullable: false }),
      impressions: t.int({ nullable: false }),
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
