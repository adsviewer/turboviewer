'use client';

import { ActionIcon, Modal, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import { type IntegrationType } from '@/graphql/generated/schema-server';

interface PropsType {
  channel: IntegrationType;
  integrationTitle: string;
}

export default function UpdateAdAccountsButton(props: PropsType): ReactNode {
  const t = useTranslations('integrations');
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      {/* Update button */}
      <Tooltip label={t('updateAdAccountsTitle')}>
        <ActionIcon
          variant="default"
          onClick={() => {
            open();
          }}
        >
          <IconEdit size={22} />
        </ActionIcon>
      </Tooltip>

      {/* Update modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={`${t('updateAdAccountsTitle')} (${props.integrationTitle})`}
        size="md"
        centered
      ></Modal>
    </>
  );
}
