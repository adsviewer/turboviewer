'use client';
import { Provider } from 'urql';
import React from 'react';
import { urqlSubClient } from '@/lib/urql/urql-client-side-client';

interface MyProps {
  token: string | undefined;
  acceptLanguage: string | null;
  children?: React.ReactNode;
}
export function UrqlProvider({ token, acceptLanguage, children }: MyProps): React.ReactElement {
  const urqlClient = urqlSubClient(token, acceptLanguage);
  return <Provider value={urqlClient}>{children}</Provider>;
}
