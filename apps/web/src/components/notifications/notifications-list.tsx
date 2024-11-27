'use client';

import React, { type ReactNode } from 'react';
import { ScrollArea, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { type Notification } from '@/graphql/generated/schema-server';
import NotificationEntry from './notification-entry';

interface PropsType {
  notifications: Notification[];
}

export default function NotificationsList(props: PropsType): ReactNode {
  const tGeneric = useTranslations('generic');

  return (
    <ScrollArea.Autosize offsetScrollbars scrollbars="y" type="always" mah={300}>
      {props.notifications.length ? (
        props.notifications.map((notification) => <NotificationEntry key={notification.id} data={notification} />)
      ) : (
        <Text ta="center" c="dimmed">
          {tGeneric('noResultsFound')}
        </Text>
      )}
    </ScrollArea.Autosize>
  );
}
