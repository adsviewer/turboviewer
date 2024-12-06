'use client';

import React, { type ReactNode } from 'react';
import { Avatar, Flex, Text } from '@mantine/core';
import { timeAgo } from '@repo/utils';
import { useAtomValue } from 'jotai';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import type { CommentItemType } from './comments';
import CommentOptions from './comment-options';
import classes from './comment.module.scss';

interface PropsType {
  data: CommentItemType;
  eraseComment: (commentToDeleteId: string) => void;
}

export default function Comment(props: PropsType): ReactNode {
  const userDetails = useAtomValue(userDetailsAtom);

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
        <div dangerouslySetInnerHTML={{ __html: props.data.comment }} className={classes.commentBody} />
      </Flex>

      {props.data.userId === userDetails.id ? (
        <Flex ml="auto">
          <CommentOptions data={props.data} eraseComment={props.eraseComment} />
        </Flex>
      ) : null}
    </Flex>
  );
}
