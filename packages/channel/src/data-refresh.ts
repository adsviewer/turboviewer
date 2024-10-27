import { logger } from '@repo/logger';
import { type AdAccount, type Integration, prisma, PublisherEnum } from '@repo/database';
import {
  getAdAccountWithIntegration,
  getAllConnectedIntegrations,
  getConnectedIntegrationsById,
  insightsColumnsOrderBy,
} from '@repo/channel-utils';
import type { z } from 'zod';
import { addInterval, type AError, getTodayStartOfDay, isAError } from '@repo/utils';
import { type channelIngressInput, type channelIngressOutput, invokeChannelIngressLambda } from '@repo/lambda-utils';
import { Environment, MODE } from '@repo/mode';
import _ from 'lodash';
import { getChannel } from './channel-helper';
import { asyncReportChannels } from './report-process';
import { getInsightsHelper } from './insights-helper';
import { deleteInsightsCache } from './insights-cache';

const saveChannelData = async (
  integration: Integration,
  adAccount: AdAccount,
  initial: boolean,
): Promise<AError | undefined> => {
  logger.info(`Starting ${initial ? 'initial' : 'periodic'} ad ingress for adAccountId: ${adAccount.id}`);

  const channel = getChannel(integration.type);
  const data = await channel.getAdAccountData(integration, adAccount, initial);
  if (isAError(data)) return data;
  // @ts-expect-error -- this is fine
  if (!asyncReportChannels.includes(integration.type)) {
    await Promise.all([
      prisma.integration.update({
        where: { id: integration.id },
        data: { lastSyncedAt: new Date() },
      }),
      prisma.adAccount.update({
        where: { id: adAccount.id },
        data: { lastSyncedAt: new Date() },
      }),
    ]);
  }
};

export const cacheSummaryTopAds = async (ints?: Integration[]): Promise<void> => {
  logger.info(`Caching summary and top ads for ${ints ? ints.map((i) => i.id).join(',') : 'all'} organizations`);
  const integrations = ints ? ints : await getAllConnectedIntegrations();
  const organizationIds = new Set(integrations.map((integration) => integration.organizationId));
  for (const organizationId of organizationIds) {
    deleteInsightsCache(organizationId);
    logger.info(`Caching summary for ${organizationId}`);
    for (const orderBy of insightsColumnsOrderBy) {
      const todayStartOfDay = getTodayStartOfDay();
      await getInsightsHelper(
        {
          page: 1,
          pageSize: 9,
          search: {},
          adAccountIds: [],
          dateFrom: addInterval(todayStartOfDay, 'day', -7),
          dateTo: todayStartOfDay,
          groupBy: ['publisher'],
          interval: 'day',
          order: 'desc',
          orderBy,
          publishers: [],
        },
        organizationId,
      );

      logger.info(`Caching top ads for ${orderBy}`);
      for (const publisher of Object.values(PublisherEnum)) {
        await getInsightsHelper(
          {
            page: 1,
            pageSize: 3,
            search: {},
            adAccountIds: [],
            dateFrom: addInterval(todayStartOfDay, 'day', -7),
            dateTo: todayStartOfDay,
            groupBy: ['adId', 'publisher'],
            interval: 'week',
            order: 'desc',
            orderBy,
            publishers: [publisher],
          },
          organizationId,
        );
      }
    }
  }
};

export const refreshData = async ({
  initial,
  adAccountIds,
}: z.infer<typeof channelIngressInput>): Promise<z.infer<typeof channelIngressOutput>> => {
  for (const adAccountId of adAccountIds) {
    const adAccountIntegration = await getAdAccountWithIntegration(adAccountId);
    if (isAError(adAccountIntegration)) {
      continue;
    }
    await saveChannelData(adAccountIntegration.integration, adAccountIntegration.adAccount, initial);
  }

  return {
    statusCode: 200,
    body: 'Success',
  };
};

export const invokeChannelIngress = async (
  initial: boolean,
  integrationIds?: string[],
): Promise<(AError | z.infer<typeof channelIngressOutput>)[] | z.infer<typeof channelIngressOutput> | AError> => {
  const integrations = integrationIds
    ? await getConnectedIntegrationsById(integrationIds)
    : await getAllConnectedIntegrations();

  const adAccounts: AdAccount[] = [];
  for (const integration of integrations) {
    const channel = getChannel(integration.type);
    const accounts = await channel.saveAdAccounts(integration);
    if (!isAError(accounts)) adAccounts.push(...accounts);
  }

  const uniqueAdAccounts = _.uniqBy(adAccounts, (adAccount) => adAccount.id);

  if (MODE === Environment.Local) {
    return await refreshData({ initial, adAccountIds: uniqueAdAccounts.map((adAccount) => adAccount.id) });
  }

  const [asyncReportAdAccounts, nonAsyncReportAdAccounts] = _.partition(uniqueAdAccounts, (adAccount) =>
    // @ts-expect-error -- we are partitioning the integrations based on the type
    asyncReportChannels.includes(adAccount.type),
  );
  const results: (AError | z.infer<typeof channelIngressOutput>)[] = [];

  results.push(
    await invokeChannelIngressLambda({
      initial,
      adAccountIds: asyncReportAdAccounts.map((adAccount) => adAccount.id),
    } satisfies z.infer<typeof channelIngressInput>),
  );

  const slicedAdAccounts = _.chunk(nonAsyncReportAdAccounts, 10);
  for (const accounts of slicedAdAccounts) {
    const invocations = await Promise.all(
      accounts.map((adAccount) =>
        invokeChannelIngressLambda({
          initial,
          adAccountIds: [adAccount.id],
        } satisfies z.infer<typeof channelIngressInput>),
      ),
    );
    results.push(...invocations);
  }

  return results;
};
