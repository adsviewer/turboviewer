'use client';

import { Tooltip, ActionIcon, Modal, Text, Divider, Indicator, Button, Flex } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { IconMessage, IconSend2, IconX } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState, type ReactNode } from 'react';
import { useAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { createFullName, removeHTMLTags } from '@/util/format-utils';
import { type CommentsQuery } from '@/graphql/generated/schema-server';
import { deleteComment, getComments, upsertComment } from '@/app/(authenticated)/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import { editedCommentAtom } from '@/app/atoms/comment-atoms';
import { isParamInSearchParams, urlKeys } from '@/util/url-query-utils';
import CommentsList from './comments-list';
import CommentInput from './comment-input/comment-input';

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
  const searchParams = useSearchParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [editedComment, setEditedComment] = useAtom(editedCommentAtom);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [taggedUsersIds, setTaggedUsersIds] = useState<string[]>([]);

  // Comment Input params
  const [commentInputContent, setCommentInputContent] = useState<string>('');
  const [commentInputContentTemp, setCommentInputContentTemp] = useState<string>('');
  const [commentInputContentLength, setCommentInputContentLength] = useState<number>(0);

  useEffect(() => {
    // Populate the comment input field and its params if a comment is being edited
    if (editedComment?.body) {
      setCommentInputContent(editedComment.body);
      setCommentInputContentLength(removeHTMLTags(editedComment.body).length);
      setCommentInputContentTemp(editedComment.body);
    }

    // Open the comments modal if the "show comments" query param is present
    if (isParamInSearchParams(searchParams, urlKeys.showComments, 'true')) {
      openModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form is not a dependency
  }, [editedComment?.body]);

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
    void upsertComment({
      creativeId: props.creativeId,
      body: commentBody,
      commentToUpdateId: editedComment?.id,
      taggedUsersIds,
    })
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

  const eraseComment = (commentToDeleteId: string): void => {
    setIsPending(true);
    void deleteComment({ commentId: commentToDeleteId })
      .then((res) => {
        if (!res.success) {
          notifications.show({
            title: tGeneric('error'),
            message: String(res.error),
            color: 'red',
          });
          return;
        }
        loadComments();
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const resetForm = (): void => {
    setEditedComment(null);
    setCommentInputContent('');
    setCommentInputContentTemp('');
    setCommentInputContentLength(0);
  };

  const handleSubmit = (content: string): void => {
    if (content.length > 0) {
      sendComment(content);
      resetForm();
    }
  };

  const closeModal = (): void => {
    resetForm();
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
        {!isLoadingComments ? <CommentsList comments={comments} eraseComment={eraseComment} /> : <LoaderCentered />}

        {/* New Comment */}
        <Indicator
          label={`${String(commentInputContentLength)} / ${String(MAX_COMMENT_LENGTH)}`}
          size={16}
          position="bottom-end"
          offset={22}
        >
          <CommentInput
            disabled={isPending || isLoadingComments}
            placeholder={t('comments.commentHint')}
            maxLength={MAX_COMMENT_LENGTH}
            content={commentInputContent}
            contentTemp={commentInputContentTemp}
            onContentChanged={setCommentInputContent}
            onContentLengthChanged={setCommentInputContentLength}
            onCtrlEnter={handleSubmit}
            onSubmit={handleSubmit}
            setCommentInputContentTemp={setCommentInputContentTemp}
            setTaggedUsersIds={setTaggedUsersIds}
          />
        </Indicator>
        <Flex w="100%">
          {editedComment?.id ? (
            <Button variant="transparent" rightSection={<IconX />} mr="auto" onClick={resetForm}>
              {t('comments.cancelEditing')}
            </Button>
          ) : null}

          <Button
            type="submit"
            disabled={commentInputContentLength === 0 || isLoadingComments}
            loading={isPending}
            rightSection={<IconSend2 />}
            ml="auto"
            onClick={() => {
              handleSubmit(commentInputContentTemp);
            }}
          >
            {t('comments.send')}
          </Button>
        </Flex>
      </Modal>
    </>
  );
}
