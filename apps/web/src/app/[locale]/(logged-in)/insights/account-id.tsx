import React from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import MultiFilter from '@/components/filters/multi-filter';

export default async function AccountId(): Promise<React.ReactElement | null> {
  const accounts = (await urqlClientSdk().adAccounts()).integrations.flatMap((integration) => integration.adAccounts);
  if (accounts.length <= 1) return null;
  return <MultiFilter options={accounts.map((a) => ({ value: a.id, label: a.name }))} groupKey="account" />;
}
