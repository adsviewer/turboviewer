'use client';

import { useSearchParams } from 'next/navigation';
import { Notifications, notifications } from '@mantine/notifications';
import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export default function NotificationsHandler(): ReactNode {
  const t = useTranslations('generic');
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show error notification
    const error = searchParams.get('error');
    if (error) {
      notifications.show({
        title: t('error'),
        message: error,
        color: 'red',
      });
    }
  }, [searchParams, t]);

  return <Notifications />;
}
