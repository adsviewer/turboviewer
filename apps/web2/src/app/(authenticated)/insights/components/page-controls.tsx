'use client';

import { Button, Flex } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function PageControls(): React.ReactNode {
  const t = useTranslations('insights');
  return (
    <Flex justify="space-between" my="lg" gap="sm">
      <Button leftSection={<IconArrowLeft size={14} />} variant="default">
        {t('prevPage')}
      </Button>
      <Button rightSection={<IconArrowRight size={14} />} variant="default">
        {t('nextPage')}
      </Button>
    </Flex>
  );
}
