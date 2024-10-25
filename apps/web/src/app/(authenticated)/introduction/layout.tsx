import React, { Suspense } from 'react';
import { Title, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import LoaderCentered from '@/components/misc/loader-centered';

export default function IntroductionLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('introduction');
  return (
    <>
      <Title mb="md">{t('title')}</Title>
      <Text mb="xl">{t('description')}</Text>
      <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
    </>
  );
}
