'use client';

import { useDisclosure } from '@mantine/hooks';
import { ActionIcon, Flex, Group, Modal, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import React from 'react';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import LanguagePickerSimple from '../dropdowns/language-picker-simple/language-picker-simple';
import ColorSchemePicker from '../dropdowns/color-scheme-picker/color-scheme-picker';

export default function SettingsButton(): ReactNode {
  const t = useTranslations('settings');
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Group justify="center">
      {/* Icon Button */}
      <ActionIcon onClick={open} variant="default" size="xl" aria-label="Settings">
        <IconSettings />
      </ActionIcon>

      {/* Modal */}
      <Modal opened={opened} onClose={close} title={t('title')} size="md" centered>
        <Flex align="center" my="sm">
          <Text mr="auto" size="sm">
            {t('changeLanguage')}:{' '}
          </Text>
          <LanguagePickerSimple />
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
