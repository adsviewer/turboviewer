'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import ServerErrorPage from '@/components/misc/server-error-page/server-error-page';

export default function ErrorLayout({ error }: { error: unknown }): React.ReactNode {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ServerErrorPage />;
}
