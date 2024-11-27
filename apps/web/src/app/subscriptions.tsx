'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import {
  type NewIntegrationSubscription,
  type NewNotificationSubscription,
  useNewIntegrationSubscription,
  useNewNotificationSubscription,
} from '@/graphql/generated/schema-client';
import { type Notification } from '@/graphql/generated/schema-server';
import { refreshJWTToken } from './(authenticated)/actions';
import { changeJWT } from './(unauthenticated)/actions';
import { notificationsDataAtom } from './atoms/notifications-atom';

export function Subscriptions(): null {
  const [notificationsData, setNotificationsData] = useAtom(notificationsDataAtom);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  // Notifications
  useNewNotificationSubscription({}, (_prev, data): NewNotificationSubscription => {
    const incomingNotification = data.newNotification as unknown as Notification;
    setNewNotification(incomingNotification);
    return data;
  });

  useEffect(() => {
    if (newNotification) {
      setNotificationsData([newNotification, ...notificationsData]);
      setNewNotification(null);
    }
  }, [newNotification, notificationsData, setNotificationsData]);

  // New Integration
  useNewIntegrationSubscription({}, (_prev, data): NewIntegrationSubscription => {
    void refreshJWTToken().then((res) => changeJWT(res.refreshToken));
    return data;
  });

  return null;
}
