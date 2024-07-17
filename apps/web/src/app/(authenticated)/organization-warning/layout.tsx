import React, { Suspense } from 'react';
import { Title, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import LoaderCentered from '@/components/misc/loader-centered';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('organization');
  return (
    <>
      <Title mb="md">{t('titleWarning')}</Title>
      <Text mb="xl">{t('descriptionWarning')}</Text>
      <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
    </>
  );
}
