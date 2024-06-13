'use client';

import { Group, Avatar, Text, Flex } from '@mantine/core';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getUserDetails } from '@/app/(authenticated)/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import classes from './user-button.module.scss';

interface UserDetailsType {
  firstName: string;
  lastName: string;
  email: string;
}

export default function UserButton(): ReactNode {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<UserDetailsType>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    void getUserDetails().then((res) => {
      setUserDetails({
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
      });
      setIsDataLoaded(true);
    });
  }, []);

  const redirectToUser = (): void => {
    router.push('profile');
  };

  return (
    <Flex justify="flex-start" className={classes.user}>
      {isDataLoaded ? (
        <Group onClick={redirectToUser}>
          <Avatar
            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-0.png"
            radius="xl"
          />

          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500}>
              {`${userDetails.firstName} ${userDetails.lastName}`}
            </Text>

            <Text c="dimmed" size="xs">
              {userDetails.email}
            </Text>
          </div>
        </Group>
      ) : (
        <LoaderCentered />
      )}
    </Flex>
  );
}
