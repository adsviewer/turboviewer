import { prisma, Prisma } from '@repo/database';
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
      adAccountId: t.arg.string({ required: false }),
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
            id: args.adAccountId ?? undefined,
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

      const groupByColumns = [...(args.groupBy ?? []), 'date'] as const;
      const grouped = await prisma.insight.groupBy({
        by: [...groupByColumns],
        _sum: {
          spend: true,
          impressions: true,
        },
        where,
        orderBy: { _sum: { [args.orderBy]: args.highestFirst ? 'desc' : 'asc' } },
        take: args.take,
        skip: args.skip,
      });

      const count = await prisma.insight.findMany({
        select: { id: true },
        distinct: [...groupByColumns],
        where,
      });

      const edges = grouped.map((group) => ({
        id: 'null',
        /* eslint-disable @typescript-eslint/no-unnecessary-condition -- This is a hack :( */
        adId: group.adId ?? 'null',
        date: group.date,
        device: group.device ?? 'null',
        publisher: group.publisher ?? 'null',
        position: group.position ?? 'null',
        spend: group._sum.spend ?? 0,
        impressions: group._sum.impressions ?? 0,
        /* eslint-enable @typescript-eslint/no-unnecessary-condition -- This is a hack :( */
      }));
      return {
        totalCount: count.length,
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
    date: t.field({ type: 'Date' }),
    device: t.field({ type: DeviceEnumDto }),
    publisher: t.field({ type: PublisherEnumDto, nullable: true }),
    position: t.string({ nullable: true }),
    spend: t.int({ nullable: false }),
    impressions: t.int({ nullable: false }),
  }),
});
