'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { TOKEN_KEY } from '@repo/utils';
import { logger } from '@repo/logger';
import { decodeJwt } from 'jose';
import type { AJwtPayload } from '@repo/shared-types';
import { getCookie } from 'cookies-next';

export default function SetUserSentry(): null {
  const token = getCookie(TOKEN_KEY);
  useEffect(() => {
    if (token) {
      logger.info('nikos');
      const tokenData = decodeJwt(token) as AJwtPayload;
      Sentry.setUser({ id: tokenData.userId });
      Sentry.setContext('user', { organizationId: tokenData.organizationId });
    }
  }, [token]);
  return null;
}
