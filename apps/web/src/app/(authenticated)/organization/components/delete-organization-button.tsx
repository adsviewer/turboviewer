'use client';

import { Flex, Text, Button, Modal, Alert, Input, useMantineTheme } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { useState } from 'react';
// import { deAuthIntegration } from '@/app/(authenticated)/integrations/actions';

export default function DeleteOrganizationButton(): React.ReactNode {
  const t = useTranslations('organization');
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteFieldValue, setDeleteFieldValue] = useInputState('');
  const [isDeleteDone, setIsDeleteDone] = useState<boolean>(true);

  const closeDeleteModal = (): void => {
    close();
    setDeleteFieldValue('');
  };

  const deleteOrganization = (): void => {
    setIsDeleteDone(false);
    // void deAuthIntegration(props.integrationType).then(() => {
    //   setIsRevokeDone(true);
    //   closeRevokeModal();
    //   router.refresh();
    // });
  };

  return (
    <Flex my="md">
      <Button leftSection={<IconTrash size={18} />} color={theme.colors.red[7]} onClick={open}>
        {t('deleteOrganization')}
      </Button>

      {/* Delete Modal */}
      <Modal opened={opened} onClose={closeDeleteModal} title={t('deleteOrganization')}>
        <Flex direction="column" gap="sm">
          <Alert variant="light" color="yellow" icon={<IconAlertTriangle />}>
            {t('deleteWarning')}
          </Alert>
          <Text ta="center">{t('deleteTip')}</Text>
          <Input
            value={deleteFieldValue}
            onChange={(event) => {
              setDeleteFieldValue(event.currentTarget.value);
            }}
          />
          <Button color="red" disabled={deleteFieldValue !== 'DELETE' || !isDeleteDone} onClick={deleteOrganization}>
            {t('delete')}
          </Button>
        </Flex>
      </Modal>
    </Flex>
  );
}
