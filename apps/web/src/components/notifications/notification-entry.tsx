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
    logger.info(props.data);
    switch (props.data.type) {
      case NotificationTypeEnum.COMMENT_MENTION:
        router.push(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access -- allow until we figure out prisma json types
          `/analytical?${urlKeys.groupedBy}=${InsightsColumnsGroupBy.creativeId}&${urlKeys.creativeIds}=${props.data.extraData.commentMentionCreativeId}&${urlKeys.showComments}=true`,
        );
        props.closeNotifications();
        break;
      case NotificationTypeEnum.NEW_INTEGRATION:
        router.push(`/integrations`);
        break;
    }
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
