'use client';

import React, { type ReactNode } from 'react';
import { Flex, Indicator, Text } from '@mantine/core';
import { timeAgo } from '@repo/utils';
import { useTranslations } from 'next-intl';
import { logger } from '@repo/logger';
import { type Notification, NotificationTypeEnum } from '@/graphql/generated/schema-server';
import classes from './notification-entry.module.scss';

interface PropsType {
  data: Notification;
}

export default function NotificationEntry(props: PropsType): ReactNode {
  const t = useTranslations('notifications');

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
  };

  return (
    <Flex h={50} w="100%" className={classes.container} gap="sm" onClick={onNotificationClick}>
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
