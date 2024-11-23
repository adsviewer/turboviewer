import React from 'react';
import { Title } from '@mantine/core';
import { useTranslations } from 'next-intl';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('insights');
  return (
    <>
      <Title mb="md">{t('title')}</Title>
      {children}
    </>
  );
}
