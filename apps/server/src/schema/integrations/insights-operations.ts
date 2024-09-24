import { type CurrencyEnum, type DeviceEnum, type Insight, prisma, type PublisherEnum } from '@repo/database';
import { FireAndForget, groupBy as groupByUtil, isAError } from '@repo/utils';
import {
  adWithAdAccount,
  getChannel,
  getDecryptedIntegration,
  getInsightsCache,
  iFramePerInsight,
  IFrameTypeEnum,
  type IFrameWithType,
  invokeChannelIngress,
  setInsightsCache,
} from '@repo/channel';
import * as changeCase from 'change-case';
import { logger } from '@repo/logger';
import { builder } from '../builder';
import { groupedInsights, insightsDatapoints } from '../../utils/insights-query-builder';
import {
  AdDto,
  CurrencyEnumDto,
  DeviceEnumDto,
  FilterInsightsInput,
  type InsightsColumnsGroupByType,
  InsightsDatapointsInput,
  PublisherEnumDto,
} from './integration-types';

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
    resolve: async (_root, args, ctx, _info) => {
      const redisValue = await getInsightsCache<GroupedInsightsType>(ctx.organizationId, args.filter);
      if (redisValue) return redisValue;

      const groupBy: (InsightsColumnsGroupByType | 'currency')[] = [...(args.filter.groupBy ?? []), 'currency'];

      const insightsRaw: Record<string, never>[] = await prisma.$queryRawUnsafe(
        groupedInsights(args.filter, ctx.organizationId, ctx.acceptedLocale),
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
      }) as unknown as (Insight & { cpm: number; campaignId: string; adSetId: string })[];

      const ret: {
        id: string;
        adAccountId?: string;
        adId?: string;
        position?: string;
        device?: DeviceEnum;
        publisher?: PublisherEnum;
        currency: CurrencyEnum;
        datapoints: { spend: bigint; impressions: bigint; date: Date; cpm: bigint }[];
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
            datapoints: value.map((v) => ({
              spend: BigInt(v.spend),
              impressions: BigInt(v.impressions),
              date: v.date,
              cpm: BigInt(Math.round(v.cpm)),
            })),
          });
        }
      }

      const hasNext = ret.length > args.filter.pageSize;
      if (hasNext) ret.pop();

      const retVal = {
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
  fillAdSetsAndCampaigns: t.withAuth({ isAdmin: true }).field({
    type: 'Boolean',
    nullable: false,
    args: {
      integrationIds: t.arg.stringList({ required: false }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      const integrations = await prisma.integration.findMany({
        where: {
          id: { in: args.integrationIds ?? undefined },
        },
      });

      for (const integration of integrations) {
        const decryptedIntegration = await getDecryptedIntegration(integration.id);
        if (isAError(decryptedIntegration)) {
          logger.error(`Failed to decrypt integration ${integration.id}`);
          continue;
        }

        const ads = await prisma.ad.findMany({
          where: {
            adSetId: null,
            adAccount: {
              integration: {
                id: decryptedIntegration.id,
              },
            },
          },
          ...adWithAdAccount,
        });
        const groupByAdAccount = groupByUtil(ads, (a) => a.adAccountId);
        const channel = getChannel(integration.type);
        await channel.saveOldInsightsAdsAdsSetsCampaigns(decryptedIntegration, groupByAdAccount);
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

const GroupedInsightsDto = builder.simpleObject('GroupedInsight', {
  interfaces: [PaginationDto],
  fields: (t) => ({
    edges: t.field({ type: [GroupedInsightDto], nullable: false }),
  }),
});
type GroupedInsightsType = typeof GroupedInsightsDto.$inferType;

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
  'GroupedInsights',
  {
    fields: (t) => ({
      datapoints: t.field({ type: [InsightsDatapointsDto], nullable: false }),
      id: t.string({ nullable: false }),
      adId: t.string({ nullable: true }),
      adAccountId: t.string({ nullable: true }),
      adSetId: t.string({ nullable: true }),
      campaignId: t.string({ nullable: true }),
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
    spend: t.field({ type: 'BigInt', nullable: false, description: 'In Cents' }),
    impressions: t.field({ type: 'BigInt', nullable: false }),
    cpm: t.field({ type: 'BigInt', nullable: true }),
    date: t.field({ type: 'Date', nullable: false }),
  }),
});
