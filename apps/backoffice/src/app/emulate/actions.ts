'use server';

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
  redirect(`${env.NEXT_WEBAPP_ENDPOINT}/api/auth/sign-in?token=${tokens.token}&refreshToken=${tokens.refreshToken}`);
};
