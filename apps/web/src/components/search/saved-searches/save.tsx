import { ActionIcon, Flex, Radio, Text, TextInput, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { logger } from '@repo/logger';
import { IconDeviceFloppy } from '@tabler/icons-react';

export default function Save(): React.ReactNode {
  const openModal = (): void => {
    modals.openConfirmModal({
      title: 'Please confirm your action',
      children: (
        <Flex direction="column" gap="sm">
          <TextInput description="Configuration Name" placeholder="Configuration Name" mb="sm" />
          <Text size="sm">
            You are about to save this search configuration. Please decide if you want it saved for your current
            organization or just you.
          </Text>
          <Radio.Group>
            <Flex direction="column" gap="sm">
              <Radio value="1" label="Update selected search" />
              <Radio value="2" label="Save as new only for me" />
              <Radio value="3" label="Save as new for organization" />
            </Flex>
          </Radio.Group>
        </Flex>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onCancel: () => {
        logger.info('Cancel');
      },
      onConfirm: () => {
        logger.info('Confirmed');
      },
    });
  };

  return (
    <Tooltip label="Save">
      <ActionIcon variant="outline" size={34} onClick={openModal}>
        <IconDeviceFloppy />
      </ActionIcon>
    </Tooltip>
  );
}
