import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { logger } from '@repo/logger';
import { IconTrash } from '@tabler/icons-react';

interface PropsType {
  isPending: boolean;
  handleDelete: () => void;
}

export default function Delete(props: PropsType): React.ReactNode {
  const openModal = (): void => {
    modals.openConfirmModal({
      title: 'Please confirm your action',
      children: (
        <Text size="sm">
          You are about to erase this advanced search configuration. Please confirm your action to proceed.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { loading: props.isPending, color: 'red' },
      onCancel: () => {
        logger.info('Cancel');
      },
      onConfirm: () => {
        props.handleDelete();
        logger.info('Confirmed');
      },
    });
  };

  return (
    <Tooltip label="Delete">
      <ActionIcon disabled={props.isPending} color="red.4" variant="outline" size={34} onClick={openModal}>
        <IconTrash />
      </ActionIcon>
    </Tooltip>
  );
}
