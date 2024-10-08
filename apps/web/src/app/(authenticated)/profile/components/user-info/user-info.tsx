import React from 'react';
import { Avatar, Text, Group, Skeleton, Flex } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { type MeQuery } from '@/graphql/generated/schema-server';
import classes from './user-info.module.scss';

interface PropsType {
  userDetails: MeQuery['me'];
}

export function UserInfo({ userDetails }: PropsType): React.ReactNode {
  const t = useTranslations('profile');
  const roleToRoleTitleMap: Record<string, string> = {
    ADMIN: t('roleAdmin'),
    ORG_ADMIN: t('roleOrgAdmin'),
    ORG_OPERATOR: t('roleOperator'),
    ORG_MEMBER: t('roleUser'),
  };

  const renderUserRoles = (roles: string[]): string => roles.map((role) => roleToRoleTitleMap[role]).join(' / ');

  return (
    <div>
      <Group wrap="nowrap">
        <Avatar src={userDetails.photoUrl} size={94} radius="md" />
        <Flex direction="column" w="100%">
          {userDetails.allRoles.length ? (
            <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
              {renderUserRoles(userDetails.allRoles)}
            </Text>
          ) : (
            <Skeleton width={220} height={20} my={2} radius={12} animate />
          )}

          {userDetails.firstName && userDetails.lastName ? (
            <Text fz="lg" fw={500} className={classes.name}>
              {`${userDetails.firstName} ${userDetails.lastName}`}
            </Text>
          ) : (
            <Skeleton width={180} height={20} my={2} radius={12} animate />
          )}

          {userDetails.email ? (
            <Text fz="xs" c="dimmed">
              {userDetails.email}
            </Text>
          ) : null}
        </Flex>
      </Group>
    </div>
  );
}
