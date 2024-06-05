import { Text, Title } from '@mantine/core';
import { type ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import IntegrationsGrid from './components/integrations-grid';

export default async function Integrations(): Promise<ReactNode> {
  const t = await getTranslations('integrations');
  const { settingsChannels } = await urqlClientSdk().settingsChannels();

  return (
    <>
      <Title mb="md">{t('title')}</Title>
      <Text mb="xl">{t('description')}</Text>
      <IntegrationsGrid integrations={settingsChannels} />
    </>
  );
}
