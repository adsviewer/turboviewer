'use client';

import React, { type ReactNode } from 'react';
import { ScrollArea, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { logger } from '@repo/logger';
import { type Notification } from '@/graphql/generated/schema-server';
import NotificationEntry from './notification-entry';

interface PropsType {
  notifications: Notification[];
  setNotificationAsRead: (data: Notification) => void;
  closeNotifications: () => void;
}

export default function NotificationsList(props: PropsType): ReactNode {
  const tGeneric = useTranslations('generic');

  return (
    <ScrollArea.Autosize
      offsetScrollbars
      scrollbars="y"
      type="always"
      mah={300}
      onBottomReached={() => {
        logger.info('bottom reached!');
      }}
    >
      {props.notifications.length ? (
        props.notifications.map((notification) => (
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
