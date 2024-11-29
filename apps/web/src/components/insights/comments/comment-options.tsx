'use client';

import { ActionIcon, Menu } from '@mantine/core';
import { IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';
import { useSetAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import { editedCommentAtom } from '@/app/atoms/comment-atoms';
import { type CommentItemType } from './comments';

interface PropsType {
  data: CommentItemType;
  eraseComment: (commentToDeleteId: string) => void;
}

export default function CommentOptions(props: PropsType): ReactNode {
  const tGeneric = useTranslations('generic');
  const setEditedComment = useSetAtom(editedCommentAtom);

  const handleEdit = (): void => {
    setEditedComment({
      id: props.data.id,
      body: props.data.comment,
    });
  };

  const handleDelete = (): void => {
    props.eraseComment(props.data.id);
  };

  return (
    <Menu width={200} shadow="md" withArrow>
      <Menu.Target>
        <ActionIcon variant="transparent" c="gray">
          <IconDotsVertical />
        </ActionIcon>
      </Menu.Target>

      {/* Options */}
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconPencil />} onClick={handleEdit}>
          {tGeneric('edit')}
        </Menu.Item>
        <Menu.Item leftSection={<IconTrash />} color="red" onClick={handleDelete}>
          {tGeneric('delete')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
