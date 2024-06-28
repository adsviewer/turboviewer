import React, { Suspense } from 'react';
import { Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import LoaderCentered from '@/components/misc/loader-centered';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('insights');
  return (
    <>
      <Title mb="md">{t('title')}</Title>
      <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
    </>
  );
}
