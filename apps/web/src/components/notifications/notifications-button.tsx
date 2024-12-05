'use client';

import {
  ActionIcon,
  Button,
  Container,
  Divider,
  Flex,
  Group,
  Indicator,
  Popover,
  Text,
  useComputedColorScheme,
} from '@mantine/core';
import { IconBell, IconBellFilled } from '@tabler/icons-react';
import React from 'react';
import { type ReactNode, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAtom } from 'jotai';
import { logger } from '@repo/logger';
import { useDisclosure, useClickOutside } from '@mantine/hooks';
import { getButtonColorBasedOnTheme } from '@/util/color-utils';
import { notificationsDataAtom } from '@/app/atoms/notifications-atom';
import { markAllNotificationsAsRead, markNotificationAsRead, notifications } from '@/app/(authenticated)/actions';
import { type Notification } from '@/graphql/generated/schema-server';
import LoaderCentered from '../misc/loader-centered';
import NotificationsList from './notifications-list';

export default function NotificationsButton(): ReactNode {
  const t = useTranslations('notifications');
  const computedColorScheme = useComputedColorScheme();
  const [opened, { open, close }] = useDisclosure(false);
  const [notificationsData, setNotificationsData] = useAtom(notificationsDataAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  // Use click outside data
  const [dropdown, setDropdown] = useState<HTMLDivElement | null>(null);
  const [control, setControl] = useState<HTMLDivElement | null>(null);
  useClickOutside(
    () => {
      close();
    },
    null,
    [control, dropdown],
  );

  useEffect(() => {
    setIsPending(true);

    void notifications()
      .then((res) => {
        if (!res.success) {
          logger.error(res);
          return;
        }
        setNotificationsData(res.data.notifications as Notification[]);
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
      void markNotificationAsRead({ notificationId: notificationEntry.id })
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

  const toggleNotifications = (): void => {
    opened ? close() : open();
  };

  const markAllAsRead = (): void => {
    setIsPending(true);
    void markAllNotificationsAsRead()
      .then((res) => {
        if (!res.success) {
          logger.error(res);
          return;
        }
        setNotificationsData(notificationsData.map((notification) => ({ ...notification, isRead: true })));
      })
      .catch((e: unknown) => {
        logger.error(e);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <Group justify="center" ref={setControl}>
      <Popover width={350} trapFocus position="bottom" withArrow shadow="md" offset={-5} opened={opened}>
        <Popover.Target>
          <Indicator size={10} offset={7} color="red" disabled={!hasUnreadNotifications()}>
            <ActionIcon
              variant="transparent"
              c={getButtonColorBasedOnTheme(computedColorScheme)}
              size={35}
              onClick={toggleNotifications}
            >
              {hasUnreadNotifications() ? <IconBellFilled /> : <IconBell />}
            </ActionIcon>
          </Indicator>
        </Popover.Target>
        <Popover.Dropdown ref={setDropdown}>
          <Flex align="center" justify="space-between">
            <Text>{t('title')}</Text>
            <Button variant="transparent" onClick={markAllAsRead} disabled={isPending}>
              {t('markAllAsRead')}
            </Button>
          </Flex>
          <Divider my="sm" />
          {!isPending ? (
            <NotificationsList
              notifications={notificationsData}
              setNotificationAsRead={setNotificationAsRead}
              closeNotifications={close}
            />
          ) : (
            <Container m="md">
              <LoaderCentered />
            </Container>
          )}
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
