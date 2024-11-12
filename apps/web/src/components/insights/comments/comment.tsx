import React, { type ReactNode } from 'react';
import { Avatar, Flex, Text } from '@mantine/core';
import { timeAgo } from '@repo/utils';
import type { CommentItemType } from './comments';

interface PropsType {
  data: CommentItemType;
}

export default function Comment(props: PropsType): ReactNode {
  return (
    <Flex gap="sm">
      <Avatar src={props.data.photoUrl} radius="xl" />
      <Flex direction="column" justify="center" gap={2}>
        <Flex>
          <Text size="sm" fw="bold">
            {props.data.name}
          </Text>
          <Text size="xs" c="dimmed" mt={2} ml={5}>
            {timeAgo(props.data.createdAt)}
          </Text>
        </Flex>

        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {props.data.comment}
        </Text>
      </Flex>
    </Flex>
  );
}
