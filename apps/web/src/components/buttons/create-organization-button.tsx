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
import { type CreateOrganizationMutationVariables } from '@/graphql/generated/schema-server';
import { createAndSwitchOrganization } from '@/app/(authenticated)/organization/actions';
import { userDetailsAtom } from '@/app/atoms/user-atoms';

export default function CreateOrganizationButton(): ReactNode {
  const t = useTranslations('organization');
  const tGeneric = useTranslations('generic');
  const userDetails = useAtomValue(userDetailsAtom);
  const [opened, { open, close }] = useDisclosure(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      name: '',
    },
  });

  const handleSubmit = (values: CreateOrganizationMutationVariables): void => {
    setIsPending(true);

    void createAndSwitchOrganization(values).then((success) => {
      if (!success) {
        logger.error(success);
      }
      window.location.reload();
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

      {/* Modal */}
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
          <Flex>
            <Button type="submit" my="md" disabled={isPending || !form.isDirty()}>
              {t('submit')}
            </Button>
          </Flex>
        </form>
      </Modal>
    </Group>
  );
}
