'use client';

import { Flex, Text, Button, Modal, Alert, Input, useMantineTheme } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { logger } from '@repo/logger';
import { isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { refreshJWTToken } from '@/app/(authenticated)/actions';
import { changeJWT } from '@/app/(unauthenticated)/actions';
import { deleteOrganization } from '../actions';

export default function DeleteOrganizationButton(): React.ReactNode {
  const t = useTranslations('organization');
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteFieldValue, setDeleteFieldValue] = useInputState('');
  const [isDeleteDone, setIsDeleteDone] = useState<boolean>(true);
  const userDetails = useAtomValue(userDetailsAtom);

  const closeDeleteModal = (): void => {
    close();
    setDeleteFieldValue('');
  };

  const performDeletion = (): void => {
    setIsDeleteDone(false);
    void deleteOrganization({ organizationId: userDetails.currentOrganization?.id ?? '' })
      .then((res) => {
        if (res.error) {
          logger.error(res.error);
          return res.error;
        }

        void refreshJWTToken().then((tokenRes) => {
          const newToken = tokenRes.refreshToken;
          void changeJWT(newToken)
            .then(() => {
              setIsDeleteDone(true);
              window.location.reload();
            })
            .catch((error: unknown) => {
              logger.error(error);
            });
        });
      })
      .catch((error: unknown) => {
        logger.error(error);
      });
  };

  return (
    <Flex my="md">
      <Button
        leftSection={<IconTrash size={18} />}
        color={theme.colors.red[7]}
        onClick={open}
        disabled={!isOrgAdmin(userDetails.allRoles)}
      >
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
          <Button color="red" disabled={deleteFieldValue !== 'DELETE' || !isDeleteDone} onClick={performDeletion}>
            {t('delete')} {userDetails.currentOrganization?.name}
          </Button>
        </Flex>
      </Modal>
    </Flex>
  );
}
