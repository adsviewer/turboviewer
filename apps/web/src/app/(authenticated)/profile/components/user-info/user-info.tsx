import React from 'react';
import { Avatar, Text, Group } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { type MeQuery } from '@/graphql/generated/schema-server';
import classes from './user-info.module.scss';

interface PropsType {
  userDetails: MeQuery['me'];
}
export function UserInfo({ userDetails }: PropsType): React.ReactNode {
  const t = useTranslations('profile');
  const roleToRoleTitleMap: Record<string, string> = {
    USER: t('roleUser'),
    ADMIN: t('roleAdmin'),
    ORG_ADMIN: t('roleOrgAdmin'),
  };

  const renderUserRoles = (roles: string[]): string => roles.map((role) => roleToRoleTitleMap[role]).join(' / ');

  return (
    <div>
      <Group wrap="nowrap">
        <Avatar src={userDetails.photoUrl} size={94} radius="md" />
        <div>
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            {renderUserRoles(userDetails.roles)}
          </Text>

          <Text fz="lg" fw={500} className={classes.name}>
            {`${userDetails.firstName} ${userDetails.lastName}`}
          </Text>

          <Text fz="xs" c="dimmed">
            {userDetails.email}
          </Text>
        </div>
      </Group>
    </div>
  );
}
