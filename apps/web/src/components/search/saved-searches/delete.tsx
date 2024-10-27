'use client';

import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconTrash } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

interface PropsType {
  canUserAlter: boolean;
  selectedSearchId: string | null;
  isPending: boolean;
  handleDelete: () => void;
}

export default function Delete(props: PropsType): React.ReactNode {
  const tSearch = useTranslations('insights.search');

  const openModal = (): void => {
    modals.openConfirmModal({
      title: tSearch('deleteSearchPresetTitle'),
      children: <Text size="sm">{tSearch('deleteDescription')}</Text>,
      labels: { confirm: tSearch('delete'), cancel: tSearch('cancel') },
      confirmProps: { loading: props.isPending, color: 'red' },
      onConfirm: () => {
        props.handleDelete();
      },
    });
  };

  return (
    <Tooltip label={tSearch('delete')}>
      <ActionIcon
        disabled={props.isPending || !props.selectedSearchId || !props.canUserAlter}
        color="red.4"
        variant="outline"
        size={34}
        onClick={openModal}
      >
        <IconTrash />
      </ActionIcon>
    </Tooltip>
  );
}
