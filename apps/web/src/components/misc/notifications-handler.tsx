'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Notifications, notifications } from '@mantine/notifications';
import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { sentenceCase } from 'change-case';
import { errorKey } from '@/util/url-query-utils';

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
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete(errorKey);
      router.replace(`${pathname}?${newSearchParams.toString()}`);
    }
  }, [pathname, router, searchParams, t]);

  return <Notifications />;
}
