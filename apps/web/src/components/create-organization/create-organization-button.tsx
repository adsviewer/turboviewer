'use client';

import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, Button, Flex, Group, Modal, Text, TextInput, Tooltip } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import React, { useState } from 'react';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from '@mantine/form';
import { logger } from '@repo/logger';
import { useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type UserRolesInput, type CreateOrganizationMutationVariables } from '@/graphql/generated/schema-server';
import { createAndSwitchOrganization } from '@/app/(authenticated)/organization/actions';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { addOrReplaceURLParams, errorKey } from '@/util/url-query-utils';
import AddUsersModal from './add-users-modal';

export default function CreateOrganizationButton(): ReactNode {
  const t = useTranslations('organization');
  const tGeneric = useTranslations('generic');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userDetails = useAtomValue(userDetailsAtom);
  const [opened, { open, close }] = useDisclosure(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const form = useForm<CreateOrganizationMutationVariables>({
    mode: 'controlled',
    initialValues: {
      name: '',
      users: [],
    },
  });

  const updateSelectedUsers = (newUsers: UserRolesInput[]): void => {
    const newUsersFiltered: UserRolesInput[] = newUsers
      .filter((user) => user.userId)
      .map((user) => ({
        userId: user.userId,
        role: user.role,
      }));
    form.setValues({ users: newUsersFiltered });
  };

  const handleSubmit = (values: CreateOrganizationMutationVariables): void => {
    setIsPending(true);

    void createAndSwitchOrganization(values)
      .then((res) => {
        if (!res.success) {
          logger.error(res.error);
          const newURL = addOrReplaceURLParams(pathname, searchParams, errorKey, String(res.error));
          router.replace(newURL);
          return;
        }
        window.location.reload();
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const closeModal = (): void => {
    close();
    form.reset();
  };

  return (
    <Group justify="center">
      {/* Icon Button */}
      <Tooltip
        label={
          !userDetails.currentOrganization?.isRoot && userDetails.currentOrganization !== null
            ? tGeneric('accessRootOrg')
            : t('createOrganization')
        }
      >
        <ActionIcon
          disabled={!userDetails.currentOrganization?.isRoot && userDetails.currentOrganization !== null}
          onClick={open}
          variant="default"
          size={35}
          aria-label="Create Organization"
        >
          <IconPlus />
        </ActionIcon>
      </Tooltip>

      {/* Create Org Modal */}
      <Modal opened={opened} onClose={closeModal} title={t('createOrganization')} size="md" centered>
        <form
          onSubmit={form.onSubmit((values) => {
            handleSubmit(values);
          })}
        >
          <Flex align="center" my="sm">
            <Text mr="auto" size="sm">
              {t('organizationName')}:{' '}
            </Text>
            <TextInput
              placeholder={t('title')}
              {...form.getInputProps('name')}
              key={form.key('name')}
              disabled={isPending}
            />
          </Flex>
          <AddUsersModal setNewUsers={updateSelectedUsers} />

          <Flex>
            <Button type="submit" disabled={isPending || !form.isDirty() || !form.values.name}>
              {t('submit')}
            </Button>
          </Flex>
        </form>
      </Modal>
    </Group>
  );
}
