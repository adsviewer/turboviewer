import React from 'react';
import { Avatar, Text, Group } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { type MeQuery } from '@/graphql/generated/schema-server';
import classes from './user-info.module.scss';

interface PropsType {
  userDetails: MeQuery['me'];
}
export function UserInfo(props: PropsType): React.ReactNode {
  const t = useTranslations('profile');
  const roleToRoleTitleMap: Record<string, string> = {
    USER: t('roleUser'),
    ADMIN: t('roleAdmin'),
    ORG_ADMIN: t('roleOrgAdmin'),
  };

  const renderUserRoles = (roles: string[]): string => {
    let userRole = '';
    roles.forEach((role, index) => {
      if (index === 0) {
        userRole += roleToRoleTitleMap[role];
      } else {
        userRole += ` / ${roleToRoleTitleMap[role]}`;
      }
    });
    return userRole;
  };

  return (
    <div>
      <Group wrap="nowrap">
        <Avatar
          src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-0.png"
          size={94}
          radius="md"
        />
        <div>
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
            {renderUserRoles(props.userDetails.roles)}
          </Text>

          <Text fz="lg" fw={500} className={classes.name}>
            {`${props.userDetails.firstName} ${props.userDetails.lastName}`}
          </Text>

          <Text fz="xs" c="dimmed">
            {props.userDetails.email}
          </Text>
        </div>
      </Group>
    </div>
  );
}
