import { Group, Avatar, Text, Flex } from '@mantine/core';
import { type ReactNode } from 'react';
import classes from './user-button.module.scss';

export interface UserProps {
  firstName: string;
  lastName: string;
  email: string;
}

export default function UserButton(props: UserProps): ReactNode {
  return (
    <Flex justify="flex-start" className={classes.user}>
      <Group>
        <Avatar
          src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png"
          radius="xl"
        />

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {`${props.firstName} ${props.lastName}`}
          </Text>

          <Text c="dimmed" size="xs">
            {props.email}
          </Text>
        </div>
      </Group>
    </Flex>
  );
}
