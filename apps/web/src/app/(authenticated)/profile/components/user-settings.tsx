'use client';

import { Flex, Transition } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { type MeQuery } from '@/graphql/generated/schema-server';
import { UserInfo } from './user-info/user-info';
import EditProfileForm from './edit-profile-form';

interface PropsType {
  userDetails: MeQuery['me'];
}

export default function UserSettings(props: PropsType): React.ReactNode {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Refresh animation on insights data changes
  useEffect(() => {
    setIsMounted(false);
    setTimeout(() => {
      setIsMounted(true);
    }, 0);
  }, [props.userDetails]);

  return (
    <Transition mounted={isMounted} transition="fade" duration={400} timingFunction="ease">
      {(styles) => (
        <div style={styles}>
          <Flex direction="column" gap="md" w="100%">
            <UserInfo userDetails={props.userDetails} />
            <EditProfileForm userDetails={props.userDetails} />
          </Flex>
        </div>
      )}
    </Transition>
  );
}
