import React from 'react';
import { useTranslations } from 'next-intl';
import { Title } from '@mantine/core';

export default function SummaryLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('summary');

  return (
    <>
      <Title mb="md">{t('title')}</Title>
      {children}
    </>
  );
}
