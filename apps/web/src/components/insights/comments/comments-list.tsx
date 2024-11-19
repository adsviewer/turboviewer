import React, { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Flex, ScrollArea, Text } from '@mantine/core';
import { type CommentItemType } from './comments';
import Comment from './comment';

interface PropsType {
  comments: CommentItemType[];
  eraseComment: (commentToDeleteId: string) => void;
}

export default function CommentsList(props: PropsType): ReactNode {
  const t = useTranslations('insights');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (props.comments.length) scrollToBottom();
  }, [props.comments.length]);

  return (
    <ScrollArea.Autosize
      viewportRef={scrollAreaRef}
      offsetScrollbars
      scrollbars="y"
      type="always"
      mah={300}
      style={{ userSelect: 'text' }}
    >
      {props.comments.length ? (
        <Flex direction="column" gap="lg">
          {props.comments.map((comment) => (
            <Comment key={comment.id} data={comment} eraseComment={props.eraseComment} />
          ))}
        </Flex>
      ) : (
        <Text size="sm" ta="center" fs="italic" c="dimmed" my="xl">
          {t('comments.noCommentsFound')}
        </Text>
      )}
    </ScrollArea.Autosize>
  );
}
