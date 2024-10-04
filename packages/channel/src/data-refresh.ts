import { logger } from '@repo/logger';
import { type Integration, prisma } from '@repo/database';
import { decryptTokens, getAllConnectedIntegrations } from '@repo/channel-utils';
import type { z } from 'zod';
import { type AError, isAError } from '@repo/utils';
import { type channelIngressInput, type channelIngressOutput, invokeChannelIngressLambda } from '@repo/lambda-utils';
import { Environment, MODE } from '@repo/mode';
import _ from 'lodash';
import { deleteInsightsCache } from './insights-cache';
import { getChannel } from './channel-helper';
import { asyncReportChannels } from './report-process';
import { getInsightsHelper } from './insights-helper';

const refreshDataOf = async (integration: Integration, initial: boolean): Promise<void> => {
  await saveChannelData(integration, initial).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    logger.error(`Error refreshing channel data for ${integration.id}. Error: ${msg}`);
  });
};

const refreshDataAll = async (initial?: boolean): Promise<void> => {
  logger.info('Refreshing all channel data');
  const integrations = await getAllConnectedIntegrations();

  for (const integration of integrations) {
    await refreshDataOf(integration, Boolean(initial));
  }
  logger.info('Refreshed all channel data');
};

const saveChannelData = async (integration: Integration, initial: boolean): Promise<AError | undefined> => {
  logger.info(`Starting ${initial ? 'initial' : 'periodic'} ad ingress for integrationId: ${integration.id}`);

  const channel = getChannel(integration.type);
  const data = await channel.getChannelData(integration, initial);
  if (isAError(data)) return data;
  // @ts-expect-error -- this is fine
  if (!asyncReportChannels.includes(integration.type)) {
    await prisma.integration.update({ where: { id: integration.id }, data: { lastSyncedAt: new Date() } });
  }
};

export const refreshData = async ({
  initial,
  integrationIds,
}: z.infer<typeof channelIngressInput>): Promise<z.infer<typeof channelIngressOutput>> => {
  if (integrationIds) {
    const integrations = await prisma.integration
      .findMany({
        where: { id: { in: integrationIds } },
      })
      .then((ints) =>
        ints.map(decryptTokens).flatMap((integration) => {
          if (!integration) return [];
          if (isAError(integration)) return [];
          return integration;
        }),
      );
    for (const integration of integrations) {
      await refreshDataOf(integration, initial);
      deleteInsightsCache(integration.organizationId);
    }

    const organizationIds = new Set(integrations.map((integration) => integration.organizationId));
    for (const organizationId of organizationIds) {
      await getInsightsHelper(
        {
          interval: 'week',
          orderBy: 'spend_abs',
          page: 1,
          pageSize: 3,
          groupBy: ['integrationType'],
        },
        organizationId,
      );
    }
  } else {
    await refreshDataAll(initial);
    deleteInsightsCache();
  }
  return {
    statusCode: 200,
    body: 'Success',
  };
};

export const invokeChannelIngress = async (
  payload: z.infer<typeof channelIngressInput>,
): Promise<(AError | z.infer<typeof channelIngressOutput>)[] | z.infer<typeof channelIngressOutput> | AError> => {
  if (MODE === Environment.Local) {
    return await refreshData(payload);
  }
  if (payload.integrationIds) {
    return await invokeChannelIngressLambda(payload);
  }

  const connectedIntegrations = await getAllConnectedIntegrations();
  const [asyncReportIntegrations, nonAsyncReportIntegrations] = _.partition(connectedIntegrations, (integration) =>
    // @ts-expect-error -- we are partitioning the integrations based on the type
    asyncReportChannels.includes(integration.type),
  );
  const results: (AError | z.infer<typeof channelIngressOutput>)[] = [];

  results.push(
    await invokeChannelIngressLambda({
      initial: payload.initial,
      integrationIds: asyncReportIntegrations.map((integration) => integration.id),
    } satisfies z.infer<typeof channelIngressInput>),
  );

  const slicedIntegrations = _.chunk(nonAsyncReportIntegrations, 10);
  for (const integrations of slicedIntegrations) {
    const invocations = await Promise.all(
      integrations.map((integration) =>
        invokeChannelIngressLambda({
          initial: payload.initial,
          integrationIds: [integration.id],
        } satisfies z.infer<typeof channelIngressInput>),
      ),
    );
    results.push(...invocations);
  }

  return results;
};
