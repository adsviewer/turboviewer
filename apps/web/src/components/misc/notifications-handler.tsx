'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Notifications, notifications } from '@mantine/notifications';
import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { sentenceCase } from 'change-case';

export default function NotificationsHandler(): ReactNode {
  const t = useTranslations('generic');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Show error notification
    const error = searchParams.get('error');
    if (error) {
      notifications.show({
        title: t('error'),
        message: sentenceCase(error),
        color: 'red',
      });
    }
    router.replace(pathname);
  }, [pathname, router, searchParams, t]);

  return <Notifications />;
}
