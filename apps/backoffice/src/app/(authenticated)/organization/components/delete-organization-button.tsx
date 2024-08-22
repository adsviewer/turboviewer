'use client';

import { Flex, Text, Button, Modal, Alert, Input, useMantineTheme } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { logger } from '@repo/logger';
import { isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { addOrReplaceURLParams, errorKey } from '@/util/url-query-utils';
import { deleteOrganizationAndRefreshJWT } from '../actions';

export interface PropsType {
  isPending: boolean;
}

export default function DeleteOrganizationButton(props: PropsType): React.ReactNode {
  const t = useTranslations('organization');
  const theme = useMantineTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    if (userDetails.currentOrganization?.id.length) {
      void deleteOrganizationAndRefreshJWT({ organizationId: userDetails.currentOrganization.id }).then((res) => {
        if (res.success) {
          window.location.reload();
        } else {
          setIsDeleteDone(true);
          logger.error(res.error);
          const newURL = addOrReplaceURLParams(pathname, searchParams, errorKey, String(res.error));
          router.replace(newURL);
        }
      });
    }
  };

  return (
    <Flex my="md" justify="flex-end">
      <Button
        leftSection={<IconTrash size={18} />}
        color={theme.colors.red[7]}
        onClick={open}
        disabled={!isOrgAdmin(userDetails.allRoles) || props.isPending}
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
