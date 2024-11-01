'use server';

import { type LoginProvidersQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export const getLoginProviders = async (inviteHash?: string | null): Promise<LoginProvidersQuery> => {
  return await (await urqlClientSdk()).loginProviders({ inviteHash });
};
