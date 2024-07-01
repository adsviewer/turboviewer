'use client';

import { useSearchParams } from 'next/navigation';
import { Notifications, notifications } from '@mantine/notifications';
import { useEffect, type ReactNode } from 'react';

export default function IntegrationsGrid(): ReactNode {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show error notification
    const error = searchParams.get('error');
    if (error) {
      notifications.show({
        message: error,
        color: 'red',
      });
    }
  }, [searchParams]);

  return <Notifications />;
}
