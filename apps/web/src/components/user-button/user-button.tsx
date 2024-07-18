'use client';

import { Group, Avatar, Text, Flex } from '@mantine/core';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { logger } from '@repo/logger';
import { getUserDetails } from '@/app/(authenticated)/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import classes from './user-button.module.scss';

export default function UserButton(): ReactNode {
  const router = useRouter();
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  useEffect(() => {
    void getUserDetails()
      .then((res) => {
        setUserDetails(res);
        setIsDataLoaded(true);
      })
      .catch((error: unknown) => {
        logger.error(error);
      });
  }, [setUserDetails]);

  const redirectToProfile = (): void => {
    router.push('profile');
  };

  return (
    <Flex justify="flex-start" className={classes.user}>
      {isDataLoaded ? (
        <Group onClick={redirectToProfile}>
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
