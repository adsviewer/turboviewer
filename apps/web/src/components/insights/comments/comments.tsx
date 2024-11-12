'use client';

import { Tooltip, ActionIcon, Modal, Text, Divider, Indicator, Textarea, Button, Flex } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { commentSchema } from '@repo/utils';
import { IconMessage, IconSend2 } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import React, { useRef, useState, type ReactNode } from 'react';
import { createFullName } from '@/util/format-utils';
import { type CommentsQuery } from '@/graphql/generated/schema-server';
import { getComments, upsertComment } from '@/app/(authenticated)/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import CommentsList from './comments-list';

interface PropsType {
  creativeId: string;
  creativeName: string;
}

export interface CommentItemType {
  id: string;
  userId: string;
  name: string;
  photoUrl?: string | null;
  comment: string;
  createdAt: Date;
}

const MAX_COMMENT_LENGTH = 3000;

export default function Comments(props: PropsType): ReactNode {
  const t = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const [opened, { open, close }] = useDisclosure(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      comment: '',
    },
    validate: zodResolver(commentSchema),
  });

  const commentsToCommentsList = (fetchedComments: CommentsQuery['comments']): CommentItemType[] => {
    return fetchedComments.map((comment) => {
      return {
        id: comment.id,
        userId: comment.user.id,
        name: createFullName(comment.user.firstName, comment.user.lastName),
        photoUrl: comment.user.photoUrl,
        comment: comment.body,
        createdAt: comment.createdAt,
      };
    });
  };

  const loadComments = (): void => {
    setIsLoadingComments(true);

    void getComments({ creativeId: props.creativeId })
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
            position: 'top-center',
          });
          return;
        }
        setComments(commentsToCommentsList(res.data.comments));
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsLoadingComments(false);
      });
  };

  const sendComment = (commentBody: string): void => {
    setIsPending(true);
    void upsertComment({ creativeId: props.creativeId, body: commentBody })
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
          return;
        }
        notifications.show({
          title: tGeneric('success'),
          message: t('comments.commentSuccess'),
          color: 'blue',
        });
        loadComments();
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const handleSubmit = (values: { comment: string }): void => {
    sendComment(values.comment);
    form.reset();
  };

  const closeModal = (): void => {
    form.reset();
    close();
  };

  const openModal = (): void => {
    open();
    loadComments();
  };

  const getCommentsTitle = (): string => {
    if (comments.length > 0) return `${t('comments.title')} (${String(comments.length)})`;
    return t('comments.title');
  };

  return (
    <>
      {/* Icon Button */}
      <Tooltip label={t('comments.title')}>
        <ActionIcon onClick={openModal} size={38} variant="subtle">
          <IconMessage />
        </ActionIcon>
      </Tooltip>

      {/* Comments Modal */}
      <Modal opened={opened} onClose={closeModal} title={getCommentsTitle()} size="md">
        <Text size="sm" ta="center" c="dimmed">
          {props.creativeName}
        </Text>
        <Divider my="md" />

        {/* Comments List */}
        {!isLoadingComments ? <CommentsList comments={comments} /> : <LoaderCentered />}

        {/* New Comment */}
        <form
          onSubmit={form.onSubmit((values) => {
            handleSubmit(values);
          })}
        >
          <Indicator
            label={`${String(messageRef.current?.value.length ?? 0)} / ${String(MAX_COMMENT_LENGTH)}`}
            size={16}
            position="top-end"
            offset={24}
          >
            <Textarea
              ref={messageRef}
              description={t('comments.commentHint')}
              key={form.key('comment')}
              {...form.getInputProps('comment')}
              placeholder={t('comments.commentHint')}
              autosize
              minRows={6}
              maxRows={3}
              maxLength={MAX_COMMENT_LENGTH}
              disabled={isPending || isLoadingComments}
              my="md"
            />
          </Indicator>
          <Flex w="100%">
            <Button
              type="submit"
              disabled={!form.isValid() || isLoadingComments}
              loading={isPending}
              rightSection={<IconSend2 />}
              ml="auto"
            >
              {t('comments.send')}
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
}
