'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { TOKEN_KEY } from '@repo/utils';
import { decodeJwt } from 'jose';
import type { AJwtPayload } from '@repo/shared-types';
import Cookies from 'js-cookie';

export default function SetUserSentry(): null {
  const token = Cookies.get(TOKEN_KEY);
  useEffect(() => {
    if (token) {
      const tokenData = decodeJwt(token) as AJwtPayload;
      Sentry.setUser({ id: tokenData.userId });
      Sentry.setContext('user', { organizationId: tokenData.organizationId });
    }
  }, [token]);
  return null;
}
