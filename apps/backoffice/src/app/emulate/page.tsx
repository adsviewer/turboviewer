'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { ActionIcon, Flex, Select } from '@mantine/core';
import { IconUserBolt } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { emulateAdminUser, getOrganizations } from '@/app/emulate/actions';

interface SelectDataType {
  value: string;
  label: string;
}

export default function EmulateOrganizations(): React.ReactNode {
  const t = useTranslations('emulate');

  const [isPending, startTransition] = useTransition();
  const [organizations, setOrganizations] = useState<SelectDataType[]>([]);
  useEffect(() => {
    startTransition(() => {
      void getOrganizations().then((res) => {
        const values = res.map((organization) => ({
          value: organization.id,
          label: organization.name,
        }));
        setOrganizations(values);
      });
    });
  }, []);

  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);

  const onEmulateClick = (): void => {
    if (selectedOrganization) {
      startTransition(() => {
        void emulateAdminUser(selectedOrganization);
      });
    }
  };

  return (
    <Flex wrap="wrap" mb="md" gap="20">
      <Select
        placeholder={t('emulateDropdownPlaceholder')}
        data={organizations}
        value={selectedOrganization}
        onChange={(value) => {
          setSelectedOrganization(value);
        }}
        allowDeselect={false}
        comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
        maw={200}
        scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
        disabled={isPending}
      />
      <ActionIcon
        onClick={onEmulateClick}
        disabled={!selectedOrganization || isPending}
        variant="default"
        size={35}
        aria-label="Settings"
      >
        <IconUserBolt />
      </ActionIcon>
    </Flex>
  );
}
