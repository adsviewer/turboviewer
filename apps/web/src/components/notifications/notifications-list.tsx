'use client';

import React, { type ReactNode } from 'react';
import { ScrollArea, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { type Notification } from '@/graphql/generated/schema-server';
import { type NotificationsData } from '@/app/atoms/notifications-atom';
import NotificationEntry from './notification-entry';

interface PropsType {
  notificationsData: NotificationsData | null;
  setNotificationAsRead: (data: Notification) => void;
  closeNotifications: () => void;
  loadNextPage: () => void;
}

export default function NotificationsList(props: PropsType): ReactNode {
  const tGeneric = useTranslations('generic');

  return (
    <ScrollArea.Autosize offsetScrollbars scrollbars="y" type="always" mah={300} onBottomReached={props.loadNextPage}>
      {props.notificationsData?.notifications.length ? (
        props.notificationsData.notifications.map((notification) => (
          <NotificationEntry
            key={notification.id}
            data={notification}
            setNotificationAsRead={() => {
              props.setNotificationAsRead(notification);
            }}
            closeNotifications={props.closeNotifications}
          />
        ))
      ) : (
        <Text ta="center" c="dimmed">
          {tGeneric('noResultsFound')}
        </Text>
      )}
    </ScrollArea.Autosize>
  );
}
