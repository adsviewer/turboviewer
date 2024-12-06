'use client';

import {
  ActionIcon,
  Container,
  Divider,
  Flex,
  Group,
  Indicator,
  Popover,
  Text,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import { IconBell, IconBellFilled } from '@tabler/icons-react';
import React, { useCallback, useEffect } from 'react';
import { type ReactNode, useState } from 'react';
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
import classes from './notifications-button.module.scss';

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

  const loadNotifications = useCallback(
    (refreshData = false): void => {
      setIsPending(true);
      void notifications({ after: !refreshData ? notificationsData?.pageInfo.endCursor : null })
        .then((res) => {
          if (!res.success) {
            logger.error(res);
            return;
          }

          if (!refreshData && notificationsData) {
            setNotificationsData({
              notifications: [
                ...notificationsData.notifications,
                ...res.data.notifications.edges.map((edge) => edge.node),
              ] as Notification[],
              pageInfo: res.data.notifications.pageInfo,
              totalUnreadNotifications: res.data.notifications.totalCount,
            });
            return;
          }

          // On refresh data
          setNotificationsData({
            notifications: res.data.notifications.edges.map((edge) => edge.node) as Notification[],
            pageInfo: res.data.notifications.pageInfo,
            totalUnreadNotifications: res.data.notifications.totalCount,
          });
        })
        .catch((error: unknown) => {
          logger.error(error);
        })
        .finally(() => {
          setIsPending(false);
        });
    },
    [notificationsData, setNotificationsData],
  );

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is fine
  }, []);

  const setNotificationAsRead = (notificationEntry: Notification): void => {
    if (!notificationEntry.isRead) {
      void markNotificationAsRead({ notificationId: notificationEntry.id })
        .then((res) => {
          if (!res.success) {
            logger.error(res);
            return;
          }
          const updatedNotifications = notificationsData?.notifications.map((notification) =>
            notification.id === notificationEntry.id ? { ...notification, isRead: true } : notification,
          );

          if (notificationsData?.notifications.length && updatedNotifications) {
            setNotificationsData({
              ...notificationsData,
              notifications: updatedNotifications,
              totalUnreadNotifications: notificationsData.totalUnreadNotifications - 1,
            });
          }
        })
        .catch((error: unknown) => {
          logger.error(error);
        });
    }
  };

  const hasUnreadNotifications = (): boolean => {
    return notificationsData?.notifications.some((notification) => !notification.isRead) ?? false;
  };

  const toggleNotifications = (): void => {
    opened ? close() : openNotificationsList();
  };

  const openNotificationsList = (): void => {
    open();
  };

  const markAllAsRead = (): void => {
    if (notificationsData?.notifications.length) {
      setIsPending(true);
      void markAllNotificationsAsRead()
        .then((res) => {
          if (!res.success) {
            logger.error(res);
            return;
          }
          setNotificationsData({
            notifications: notificationsData.notifications.map((notification) => ({ ...notification, isRead: true })),
            pageInfo: notificationsData.pageInfo,
            totalUnreadNotifications: 0,
          });
        })
        .catch((e: unknown) => {
          logger.error(e);
        })
        .finally(() => {
          setIsPending(false);
        });
    }
  };

  const loadNextPage = (): void => {
    if (notificationsData?.pageInfo.hasNextPage) loadNotifications();
  };

  const getNotificationsCount = (count: number): string => {
    return count > 9 ? '9+' : count.toString();
  };

  return (
    <Group justify="center" ref={setControl}>
      <Popover width={350} trapFocus position="bottom" withArrow shadow="md" offset={-5} opened={opened}>
        <Popover.Target>
          <Indicator
            label={getNotificationsCount(notificationsData?.totalUnreadNotifications ?? 0)}
            size={16}
            offset={7}
            color="red"
            disabled={!hasUnreadNotifications()}
          >
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
            <UnstyledButton
              className={classes.markAllAsReadButton}
              variant="transparent"
              onClick={markAllAsRead}
              disabled={isPending || !notificationsData?.notifications.length}
            >
              {t('markAllAsRead')}
            </UnstyledButton>
          </Flex>
          <Divider my="sm" />

          <NotificationsList
            notificationsData={notificationsData ?? null}
            setNotificationAsRead={setNotificationAsRead}
            closeNotifications={close}
            loadNextPage={loadNextPage}
          />
          {isPending ? (
            <Container m="md">
              <LoaderCentered />
            </Container>
          ) : null}
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
