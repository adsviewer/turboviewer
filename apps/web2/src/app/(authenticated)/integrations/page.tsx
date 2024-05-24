import { Text } from '@mantine/core';
import { type ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import IntegrationsGrid from './components/integrations-grid';

export default async function Integrations(): Promise<ReactNode> {
  const t = await getTranslations('integrations');
  const { settingsChannels } = await urqlClientSdk().settingsChannels();

  return (
    <>
      <h1>{t('title')}</h1>
      <Text mb="md">{t('description')}</Text>
      <IntegrationsGrid integrations={settingsChannels} />
    </>
  );
}
