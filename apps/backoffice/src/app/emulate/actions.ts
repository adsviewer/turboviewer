'use server';

import { cookies } from 'next/headers';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { logger } from '@repo/logger';
import { redirect } from 'next/navigation';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import type { GetOrganizationsQuery } from '@/graphql/generated/schema-server';
import { env } from '@/env.mjs';

export const getOrganizations = async (): Promise<GetOrganizationsQuery['organizations']> => {
  return (await urqlClientSdk().getOrganizations()).organizations;
};

export const emulateAdminUser = async (organizationId: string): Promise<void> => {
  logger.info(organizationId, 'Emulating orgId');
  const tokens = (await urqlClientSdk().emulateAdmin({ organizationId })).emulateAdmin;
  logger.info(tokens, 'Emulated admin user');
  const cookieStore = cookies();
  cookieStore.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  cookieStore.set(TOKEN_KEY, tokens.token);
  redirect(env.NEXT_WEBAPP_ENDPOINT);
};
