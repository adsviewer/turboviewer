'use client';

import { Group, Avatar, Text, Flex } from '@mantine/core';
import { type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import LoaderCentered from '@/components/misc/loader-centered';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import classes from './user-button.module.scss';

interface PropsType {
  isDataLoaded: boolean;
}

export default function UserButton(props: PropsType): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const userDetails = useAtomValue(userDetailsAtom);

  const redirectToProfile = (): void => {
    router.push('profile');
  };

  return (
    <Flex
      justify="flex-start"
      className={pathname === '/profile' ? `${classes.user} ${classes.buttonActive}` : classes.user}
    >
      {props.isDataLoaded ? (
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
