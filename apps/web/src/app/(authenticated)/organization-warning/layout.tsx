import React from 'react';
import { Title, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';

export default function Layout({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('organization');
  return (
    <>
      <Title mb="md">{t('titleWarning')}</Title>
      <Text mb="xl">{t('descriptionWarning')}</Text>
      {children}
    </>
  );
}
