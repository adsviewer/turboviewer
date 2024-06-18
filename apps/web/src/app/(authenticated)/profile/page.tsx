'use client';

import React from 'react';
import { Flex } from '@mantine/core';
import { UserInfo } from './components/user-info/user-info';
import EditProfileForm from './components/edit-profile-form';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { useAtomValue } from 'jotai';

export default function Profile(): React.ReactNode {
  const userDetails = useAtomValue(userDetailsAtom);

  return (
    <Flex direction="column" gap="md" w="100%">
      <UserInfo userDetails={userDetails} />
      <EditProfileForm userDetails={userDetails} />
    </Flex>
  );
}
