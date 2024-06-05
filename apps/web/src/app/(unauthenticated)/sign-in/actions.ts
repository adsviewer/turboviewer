'use server';

import { type LoginProvidersQuery } from '@/graphql/generated/schema-server';
import { urqlClientSdk } from '@/lib/urql/urql-client';

export const getLoginProviders = async (): Promise<LoginProvidersQuery> => {
  return await urqlClientSdk().loginProviders();
};
