'use client';

import { type NewIntegrationSubscription, useNewIntegrationSubscription } from '@/graphql/generated/schema-client';
import { refreshJWTToken } from './(authenticated)/actions';
import { changeJWT } from './(unauthenticated)/actions';

export function Subscriptions(): null {
  useNewIntegrationSubscription({}, (_prev, data): NewIntegrationSubscription => {
    void refreshJWTToken().then((res) => changeJWT(res.refreshToken));
    return data;
  });

  return null;
}
