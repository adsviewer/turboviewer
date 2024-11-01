'use server';

import { type DeAuthIntegrationMutation, type IntegrationType } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export const deAuthIntegration = async (
  type: IntegrationType,
): Promise<Promise<DeAuthIntegrationMutation['deAuthIntegration']>> => {
  const deAuthIntegrationMutation = await (await urqlClientSdk()).deAuthIntegration({ type });
  const { deAuthIntegration: resp } = deAuthIntegrationMutation;
  return resp;
};
