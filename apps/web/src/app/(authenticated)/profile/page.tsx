'use client';

import React from 'react';
import { Flex } from '@mantine/core';
import { useAtomValue } from 'jotai';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { UserInfo } from './components/user-info/user-info';
import EditProfileForm from './components/edit-profile-form';

export default function Profile(): React.ReactNode {
  const userDetails = useAtomValue(userDetailsAtom);

  return (
    <Flex direction="column" gap="md" w="100%">
      <UserInfo userDetails={userDetails} />
      <EditProfileForm userDetails={userDetails} />
    </Flex>
  );
}
