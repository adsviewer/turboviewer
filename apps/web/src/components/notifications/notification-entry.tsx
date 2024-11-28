'use client';

import React, { type ReactNode } from 'react';
import { Flex, Indicator, Text } from '@mantine/core';
import { timeAgo } from '@repo/utils';
import { useTranslations } from 'next-intl';
import { logger } from '@repo/logger';
import { useRouter } from 'next/navigation';
import { InsightsColumnsGroupBy, type Notification, NotificationTypeEnum } from '@/graphql/generated/schema-server';
import { urlKeys } from '@/util/url-query-utils';
import classes from './notification-entry.module.scss';

interface PropsType {
  data: Notification;
  setNotificationAsRead: () => void;
  closeNotifications: () => void;
}

export default function NotificationEntry(props: PropsType): ReactNode {
  const t = useTranslations('notifications');
  const router = useRouter();

  const getTitle = (type: NotificationTypeEnum): string => {
    switch (type) {
      case NotificationTypeEnum.COMMENT_MENTION:
        return t('mentioned');
      case NotificationTypeEnum.NEW_INTEGRATION:
        return t('newIntegration');
    }
  };

  const onNotificationClick = (): void => {
    logger.info('cm3x8pl2v03ofbzosv5lcywrh');
    router.replace(
      `/analytical?${urlKeys.groupedBy}=${InsightsColumnsGroupBy.creativeId}&${urlKeys.creativeIds}=cm3x8pl2v03ofbzosv5lcywrh&${urlKeys.showComments}=true`,
    );
    props.closeNotifications();
  };

  return (
    <Flex
      h={50}
      w="100%"
      className={classes.container}
      gap="sm"
      onClick={onNotificationClick}
      onMouseEnter={props.setNotificationAsRead}
    >
      <Flex w={10} justify="center" align="center" px="sm">
        <Indicator size={6} color={props.data.isRead ? 'dimmed' : 'blue'} />
      </Flex>
      <Flex direction="column" justify="center">
        <Text size="sm">{getTitle(props.data.type)}</Text>
        <Text size="xs" c="dimmed">
          {timeAgo(props.data.createdAt)}
        </Text>
      </Flex>
    </Flex>
  );
}
