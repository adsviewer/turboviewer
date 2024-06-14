import React from 'react';
import { Flex } from '@mantine/core';
import { getUserDetails } from '../actions';
import { UserInfo } from './components/user-info/user-info';
import EditProfileForm from './components/edit-profile-form';

export default async function Profile(): Promise<React.ReactNode> {
  const userDetails = await getUserDetails();

  return (
    <Flex direction="column" gap="md" w="100%">
      <UserInfo userDetails={userDetails} />
      <EditProfileForm userDetails={userDetails} />
    </Flex>
  );
}
