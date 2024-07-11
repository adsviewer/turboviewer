'use client';

import { Group, Avatar, Text, Flex } from '@mantine/core';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { getUserDetails } from '@/app/(authenticated)/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import classes from './user-button.module.scss';

export default function UserButton(): ReactNode {
  const router = useRouter();
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    void getUserDetails().then((res) => {
      setUserDetails({
        id: res.id,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        allRoles: res.allRoles,
        currentOrganizationId: res.currentOrganizationId,
        photoUrl: res.photoUrl,
        currentOrganization: res.currentOrganization,
      });
      setIsDataLoaded(true);
    });
  }, [setUserDetails]);

  const redirectToUser = (): void => {
    router.push('profile');
  };

  return (
    <Flex justify="flex-start" className={classes.user}>
      {isDataLoaded ? (
        <Group onClick={redirectToUser}>
          <Avatar src={userDetails.photoUrl} radius="xl" />

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
