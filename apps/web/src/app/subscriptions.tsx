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
  const [newNotificationData, setNewNotificationData] = useState<Notification | null>(null);

  // Notifications
  useNewNotificationSubscription({}, (_prev, data): NewNotificationSubscription => {
    const incomingNotification = data.newNotification as unknown as Notification;
    setNewNotificationData(incomingNotification);
    return data;
  });

  useEffect(() => {
    if (newNotificationData) {
      if (notificationsData) {
        setNotificationsData({
          notifications: [newNotificationData, ...notificationsData.notifications] as Notification[],
          pageInfo: notificationsData.pageInfo,
          totalUnreadNotifications: notificationsData.totalUnreadNotifications + 1,
        });
      }

      setNewNotificationData(null);
    }
  }, [newNotificationData, notificationsData, setNotificationsData]);

  // New Integration
  useNewIntegrationSubscription({}, (_prev, data): NewIntegrationSubscription => {
    void refreshJWTToken().then((res) => changeJWT(res.refreshToken));
    return data;
  });

  return null;
}
