'use client';

import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, Flex, Group, Modal, Text, Tooltip } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import React from 'react';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import ColorSchemePicker from '../dropdowns/color-scheme-picker/color-scheme-picker';
import LanguagePicker from '../dropdowns/language-picker/language-picker';

export default function SettingsButton(): ReactNode {
  const t = useTranslations('settings');
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Group justify="center">
      {/* Icon Button */}
      <Tooltip label={t('title')}>
        <ActionIcon onClick={open} variant="default" size={35} aria-label="Settings">
          <IconSettings />
        </ActionIcon>
      </Tooltip>

      {/* Modal */}
      <Modal opened={opened} onClose={close} title={t('title')} size="md" centered>
        <Flex align="center" my="sm">
          <Text mr="auto" size="sm">
            {t('changeLanguage')}:{' '}
          </Text>
          <LanguagePicker />
        </Flex>
        <Flex align="center">
          <Text mr="auto" size="sm">
            {t('changeColorScheme')}:{' '}
          </Text>
          <ColorSchemePicker />
        </Flex>
      </Modal>
    </Group>
  );
}
