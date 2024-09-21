'use client';

import { Button, Flex } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { useSetAtom, useAtom } from 'jotai/index';
import { addOrReplaceURLParams, urlKeys } from '@/util/url-query-utils';
import { hasNextInsightsPageAtom, insightsAtom } from '@/app/atoms/insights-atoms';

export default function PageControls(): React.ReactNode {
  const t = useTranslations('insights');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const setInsights = useSetAtom(insightsAtom);
  const [hasNextInsightsPage, setHasNextInsightsPageAtom] = useAtom(hasNextInsightsPageAtom);

  const resetInsights = (): void => {
    setInsights([]);
    setHasNextInsightsPageAtom(false);
  };

  const handlePageChange = (type: 'next' | 'prev'): void => {
    resetInsights();
    if (type === 'next') {
      const nextPage = String(Number(searchParams.get(urlKeys.page) ?? '1') + 1);
      router.replace(addOrReplaceURLParams(pathname, searchParams, urlKeys.page, nextPage));
      return;
    }
    const prevPage = String(Number(searchParams.get(urlKeys.page) ?? '1') - 1);
    router.replace(addOrReplaceURLParams(pathname, searchParams, urlKeys.page, prevPage));
  };

  return (
    <Flex justify="space-between" my="lg" gap="sm">
      <Button
        disabled={!searchParams.get(urlKeys.page) || searchParams.get(urlKeys.page) === '1'}
        leftSection={<IconArrowLeft size={14} />}
        variant="default"
        onClick={() => {
          handlePageChange('prev');
        }}
      >
        {t('prevPage')}
      </Button>
      <Button
        disabled={!hasNextInsightsPage}
        rightSection={<IconArrowRight size={14} />}
        variant="default"
        onClick={() => {
          handlePageChange('next');
        }}
      >
        {t('nextPage')}
      </Button>
    </Flex>
  );
}
