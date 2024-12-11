'use client';

import { Tooltip, ActionIcon, Modal, Text, Divider, Indicator, Button, Flex } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { logger } from '@repo/logger';
import { IconMessage, IconSend2, IconX } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { createFullName, removeHTMLTags } from '@/util/format-utils';
import { type CommentsQuery } from '@/graphql/generated/schema-server';
import { deleteComment, getComments, upsertComment } from '@/app/(authenticated)/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import { editedCommentAtom } from '@/app/atoms/comment-atoms';
import { isParamInSearchParams, urlKeys } from '@/util/url-query-utils';
import CommentsList, { type CommentsListRef } from './comments-list';
import CommentInput from './comment-input/comment-input';

interface PropsType {
  creativeId: string | null | undefined;
  creativeName: string | null | undefined;
  adId: string | null | undefined;
  adName: string | null | undefined;
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

export interface CommentsDataType {
  comments: CommentItemType[];
  pageInfo: CommentsQuery['comments']['pageInfo'];
  totalComments: number;
}

export default function Comments(props: PropsType): ReactNode {
  const t = useTranslations('insights');
  const tGeneric = useTranslations('generic');
  const searchParams = useSearchParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [editedComment, setEditedComment] = useAtom(editedCommentAtom);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [commentsData, setCommentsData] = useState<CommentsDataType | null>(null);
  const [taggedUsersIds, setTaggedUsersIds] = useState<string[]>([]);
  const commentsListRef = useRef<CommentsListRef>(null);

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

  const commentsToCommentsList = (fetchedComments: CommentsQuery['comments']['edges']): CommentItemType[] => {
    return fetchedComments.map((comment) => {
      return {
        id: comment.node.id,
        userId: comment.node.user.id,
        name: createFullName(comment.node.user.firstName, comment.node.user.lastName),
        photoUrl: comment.node.user.photoUrl,
        comment: comment.node.body,
        createdAt: comment.node.createdAt,
      };
    });
  };

  const loadComments = (refreshData = false): void => {
    setIsLoadingComments(true);
    void getComments({
      creativeId: props.creativeId ?? null,
      adId: props.adId ?? null,
      after: !refreshData ? commentsData?.pageInfo.endCursor : null,
    })
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

        if (!refreshData) {
          setCommentsData({
            comments: [...(commentsData?.comments ?? []), ...commentsToCommentsList(res.data.comments.edges)],
            pageInfo: res.data.comments.pageInfo,
            totalComments: res.data.comments.totalCount,
          });
          return;
        }

        // On refresh data
        setCommentsData({
          comments: commentsToCommentsList(res.data.comments.edges),
          pageInfo: res.data.comments.pageInfo,
          totalComments: res.data.comments.totalCount,
        });
        if (commentsListRef.current) commentsListRef.current.scrollToTop();
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
      adId: props.adId,
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
        loadComments(true);
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
    setCommentsData(null);
    resetForm();
    close();
  };

  const openModal = (): void => {
    open();
    loadComments(true);
  };

  const getCommentsTitle = (): string => {
    if (commentsData && commentsData.totalComments > 0)
      return `${t('comments.title')} (${String(commentsData.totalComments)})`;
    return t('comments.title');
  };

  const loadNextPage = (): void => {
    if (commentsData?.pageInfo.hasNextPage) loadComments();
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
        <Text size="sm" ta="center" c="dimmed" style={{ wordBreak: 'break-all' }}>
          {props.creativeName ?? props.adName}
        </Text>
        <Divider my="md" />

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

        {/* Comments List */}
        <CommentsList
          ref={commentsListRef}
          commentsData={commentsData}
          eraseComment={eraseComment}
          loadNextPage={loadNextPage}
        />
        {isLoadingComments ? <LoaderCentered /> : null}

        <Flex w="100%" mt="md">
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
