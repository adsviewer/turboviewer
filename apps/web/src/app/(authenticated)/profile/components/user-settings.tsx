import { Flex } from '@mantine/core';
import React from 'react';
import { type MeQuery } from '@/graphql/generated/schema-server';
import { UserInfo } from './user-info/user-info';
import EditProfileForm from './edit-profile-form';

interface PropsType {
  userDetails: MeQuery['me'];
}

export default function UserSettings(props: PropsType): React.ReactNode {
  return (
    <Flex direction="column" gap="md" w="100%">
      <UserInfo userDetails={props.userDetails} />
      <EditProfileForm userDetails={props.userDetails} />
    </Flex>
  );
}
