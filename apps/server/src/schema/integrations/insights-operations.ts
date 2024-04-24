import { prisma, Prisma } from '@repo/database';
import { Kind } from 'graphql/language';
import { builder } from '../builder';
import { getEndofDay } from '../../utils/date-utils';
import {
  DeviceEnumDto,
  InsightsColumnsGroupByDto,
  InsightsColumnsOrderByDto,
  PublisherEnumDto,
} from './integration-types';
import InsightWhereInput = Prisma.InsightWhereInput;

builder.queryFields((t) => ({
  insights: t.withAuth({ authenticated: true }).field({
    type: GroupedInsightsDto,
    description:
      'Get grouped insights for ads. Beware that this is not an Insight entity. You cannot ask for id or any connected entity',
    args: {
      adAccountId: t.arg.string({ required: true }),
      dateFrom: t.arg({ type: 'Date', required: false }),
      dateTo: t.arg({ type: 'Date', required: false }),
      devices: t.arg({ type: [DeviceEnumDto], required: false }),
      publishers: t.arg({ type: [PublisherEnumDto], required: false }),
      positions: t.arg.stringList({ required: false }),
      highestFirst: t.arg.boolean({ defaultValue: true }),
      orderBy: t.arg({ type: InsightsColumnsOrderByDto, required: true, defaultValue: 'spend' }),
      groupBy: t.arg({ type: [InsightsColumnsGroupByDto], required: false }),
      take: t.arg.int({ required: true, defaultValue: 10 }),
      skip: t.arg.int({ required: true, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const where: InsightWhereInput = {
        ad: {
          adAccount: {
            id: args.adAccountId,
            integration: {
              organizationId: ctx.organizationId,
            },
          },
        },
        date: { gte: args.dateFrom ?? undefined, lte: getEndofDay(args.dateTo) },
        device: { in: args.devices ?? undefined },
        publisher: { in: args.publishers ?? undefined },
        position: { in: args.positions ?? undefined },
      };

      const groupedByEdges = async () =>
        await prisma.insight
          .groupBy({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we are checking before using it
            by: [...args.groupBy!],
            _sum: {
              spend: true,
              impressions: true,
            },
            where,
            orderBy: { _sum: { [args.orderBy]: args.highestFirst ? 'desc' : 'asc' } },
            take: args.take,
            skip: args.skip,
          })
          .then((grouped) =>
            grouped.map((group) => ({
              ...group,
              spend: group._sum.spend ?? 0,
              impressions: group._sum.impressions ?? 0,
            })),
          );

      const findAllEdges = async () =>
        await prisma.insight
          .findMany({
            select: { spend: true, impressions: true },
            where,
          })
          .then((insights) => {
            const spend = insights.reduce((acc, insight) => acc + insight.spend, 0);
            const impressions = insights.reduce((acc, insight) => acc + insight.impressions, 0);
            return [{ spend, impressions }];
          });

      const edges = args.groupBy ? await groupedByEdges() : await findAllEdges();

      const totalElements = _info.fieldNodes.some((f) =>
        f.selectionSet?.selections.some((s) => s.kind === Kind.FIELD && s.name.value === 'totalCount'),
      )
        ? await prisma.insight.findMany({
            select: { id: true },
            distinct: args.groupBy ?? undefined,
            where,
          })
        : [];
      return {
        totalCount: totalElements.length,
        edges,
      };
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

const GroupedInsightDto = builder.simpleObject('GroupedInsights', {
  fields: (t) => ({
    adId: t.string({ nullable: true }),
    date: t.field({ type: 'Date', nullable: true }),
    device: t.field({ type: DeviceEnumDto, nullable: true }),
    publisher: t.field({ type: PublisherEnumDto, nullable: true }),
    position: t.string({ nullable: true }),
    spend: t.int({ nullable: false }),
    impressions: t.int({ nullable: false }),
  }),
});
