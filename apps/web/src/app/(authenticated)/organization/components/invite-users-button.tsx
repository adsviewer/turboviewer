'use client';

import { Flex, Button, Modal, useMantineTheme, PillsInput, Pill } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { IconUserPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { z } from 'zod';
import { isOperator, isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';

const emailSchema = z.string().email();

export interface PropsType {
  isPending: boolean;
}

export default function InviteUsersButton(props: PropsType): React.ReactNode {
  const t = useTranslations('organization');
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const userDetails = useAtomValue(userDetailsAtom);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInputValue, setEmailInputValue] = useState<string>('');
  // const email

  const closeModal = (): void => {
    setEmails([]);
    setEmailInputValue('');
    close();
  };

  const onEmailInputChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmailInputValue(e.target.value);
  };

  const onEmailInputConfirm = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.code === 'Space' || e.code === 'Tab' || e.code === 'Enter' || e.code === 'Comma') {
      e.preventDefault();

      if (emailSchema.safeParse(emailInputValue).success) {
        setEmails([...emails, emailInputValue]);
        setEmailInputValue('');
      }
    }
  };

  const removeEmail = (emailToRemove: string): void => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  return (
    <Flex my="md">
      <Button
        leftSection={<IconUserPlus size={18} />}
        color={theme.colors.blue[7]}
        onClick={open}
        disabled={(!isOrgAdmin(userDetails.allRoles) && !isOperator(userDetails.allRoles)) || props.isPending}
      >
        {t('inviteUsers')}
      </Button>

      {/* Delete Modal */}
      <Modal opened={opened} onClose={closeModal} title={t('inviteUsers')}>
        <Flex direction="column" gap="sm">
          <PillsInput label={`${t('enterEmails')}:`} onChange={onEmailInputChanged} onKeyDown={onEmailInputConfirm}>
            <Pill.Group>
              {emails.length
                ? emails.map((email) => (
                    <Pill
                      withRemoveButton
                      onRemove={() => {
                        removeEmail(email);
                      }}
                      key={email}
                    >
                      {email}
                    </Pill>
                  ))
                : null}
              <PillsInput.Field placeholder={t('enterEmails')} value={emailInputValue} />
            </Pill.Group>
          </PillsInput>
          <Button color="blue" disabled={!emails.length}>
            {t('invite')}
          </Button>
        </Flex>
      </Modal>
    </Flex>
  );
}
