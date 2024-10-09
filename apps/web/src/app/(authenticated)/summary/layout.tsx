import React, { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Title } from '@mantine/core';
import LoaderCentered from '@/components/misc/loader-centered';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('summary');

  return (
    <>
      <Title mb="md">{t('title')}</Title>
      <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
    </>
  );
}
