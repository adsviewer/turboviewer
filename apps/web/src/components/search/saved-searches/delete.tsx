import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconTrash } from '@tabler/icons-react';

interface PropsType {
  canUserAlter: boolean;
  selectedSearchID: string | null;
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
      onConfirm: () => {
        props.handleDelete();
      },
    });
  };

  return (
    <Tooltip label="Delete">
      <ActionIcon
        disabled={props.isPending || !props.selectedSearchID || !props.canUserAlter}
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
