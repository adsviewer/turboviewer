import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Flex, ScrollArea, Text } from '@mantine/core';
import { motion } from 'framer-motion';
import { type CommentsDataType } from './comments';
import Comment from './comment';

export interface CommentsListRef {
  scrollToTop: () => void;
}

interface PropsType {
  commentsData: CommentsDataType | null;
  eraseComment: (commentToDeleteId: string) => void;
  loadNextPage: () => void;
}

const CommentsList = forwardRef<CommentsListRef, PropsType>((props, ref) => {
  const t = useTranslations('insights');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToTop = (): void => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToTop,
  }));

  return (
    <ScrollArea.Autosize
      viewportRef={scrollAreaRef}
      offsetScrollbars
      scrollbars="y"
      type="always"
      mah={300}
      style={{ userSelect: 'text' }}
      onBottomReached={props.loadNextPage}
    >
      {props.commentsData?.comments.length ? (
        <Flex direction="column" gap="lg">
          {props.commentsData.comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'spring', stiffness: 75, duration: 0.15 }}
              exit={{ opacity: 0 }}
            >
              <Comment data={comment} eraseComment={props.eraseComment} />
            </motion.div>
          ))}
        </Flex>
      ) : (
        <Text size="sm" ta="center" fs="italic" c="dimmed" my="xl">
          {t('comments.noCommentsFound')}
        </Text>
      )}
    </ScrollArea.Autosize>
  );
});

CommentsList.displayName = 'CommentsList';

export default CommentsList;
