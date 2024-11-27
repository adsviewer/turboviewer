'use client';

import { ActionIcon, Divider, Group, Indicator, Popover, Text, useComputedColorScheme } from '@mantine/core';
import { IconBell, IconBellFilled } from '@tabler/icons-react';
import React from 'react';
import { type ReactNode, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAtom } from 'jotai';
import { logger } from '@repo/logger';
import { getButtonColorBasedOnTheme } from '@/util/color-utils';
import { notificationsDataAtom } from '@/app/atoms/notifications-atom';
import { markNotificationAsRead, notifications } from '@/app/(authenticated)/actions';
import { type Notification } from '@/graphql/generated/schema-server';
import LoaderCentered from '../misc/loader-centered';
import NotificationsList from './notifications-list';

export default function NotificationsButton(): ReactNode {
  const t = useTranslations('notifications');
  const computedColorScheme = useComputedColorScheme();
  const [notificationsData, setNotificationsData] = useAtom(notificationsDataAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    setIsPending(true);

    void notifications()
      .then((res) => {
        if (!res.success) {
          logger.error(res);
          return;
        }
        setNotificationsData(res.data.notifications);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [setNotificationsData]);

  const setNotificationAsRead = (notificationEntry: Notification): void => {
    if (!notificationEntry.isRead) {
      void markNotificationAsRead({ id: notificationEntry.id })
        .then((res) => {
          if (!res.success) {
            logger.error(res);
            return;
          }
          const updatedNotificationsData = notificationsData.map((notification) =>
            notification.id === notificationEntry.id ? { ...notification, isRead: true } : notification,
          );
          setNotificationsData(updatedNotificationsData);
        })
        .catch((error: unknown) => {
          logger.error(error);
        });
    }
  };

  const hasUnreadNotifications = (): boolean => {
    return notificationsData.some((notification) => !notification.isRead);
  };

  return (
    <Group justify="center">
      <Popover width={350} trapFocus position="bottom" withArrow shadow="md" offset={-5}>
        <Popover.Target>
          <Indicator size={10} offset={7} color="red" disabled={!hasUnreadNotifications()}>
            <ActionIcon variant="transparent" c={getButtonColorBasedOnTheme(computedColorScheme)} size={35}>
              {hasUnreadNotifications() ? <IconBellFilled /> : <IconBell />}
            </ActionIcon>
          </Indicator>
        </Popover.Target>
        <Popover.Dropdown>
          <Text>{t('title')}</Text>
          <Divider my="sm" />
          {!isPending ? (
            <NotificationsList notifications={notificationsData} setNotificationAsRead={setNotificationAsRead} />
          ) : (
            <LoaderCentered />
          )}
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
