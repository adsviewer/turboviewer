'use client';

import { Flex, Button, Modal, useMantineTheme, PillsInput, Pill } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { IconUserPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { z } from 'zod';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { isOperator, isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { OrganizationRoleEnum } from '@/graphql/generated/schema-server';
import { inviteUsers } from '../actions';

const emailSchema = z.string().email();

export interface PropsType {
  isPending: boolean;
}

export default function InviteUsersButton(props: PropsType): React.ReactNode {
  const t = useTranslations('organization');
  const tGeneric = useTranslations('generic');
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const userDetails = useAtomValue(userDetailsAtom);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInputValue, setEmailInputValue] = useState<string>('');
  const [isPending, setIsPending] = useState<boolean>(false);
  const DEFAULT_ROLE = OrganizationRoleEnum.ORG_MEMBER;

  const closeModal = (): void => {
    setEmails([]);
    setEmailInputValue('');
    setIsPending(false);
    close();
  };

  const onEmailInputChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmailInputValue(e.target.value);
  };

  const onEmailInputConfirm = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (
      e.code === 'Space' ||
      e.code === 'Tab' ||
      e.code === 'Enter' ||
      e.code === 'Comma' ||
      e.code === 'NumpadEnter'
    ) {
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

  const performUserInvites = (): void => {
    setIsPending(true);

    void inviteUsers({ emails, role: DEFAULT_ROLE })
      .then((res) => {
        logger.info(res);
        // This blows
        if (res.data?.inviteUsers.__typename === 'InviteUsersErrors' && res.data.inviteUsers.errors.length) {
          for (const inviteData of res.data.inviteUsers.errors) {
            if (inviteData.message) {
              const errorMessage = `${inviteData.email}: ${inviteData.message}`;
              notifications.show({
                title: tGeneric('error'),
                message: errorMessage,
                color: 'red',
              });
            }
          }
          return;
        }

        notifications.show({
          title: tGeneric('success'),
          message: t('inviteSuccess'),
          color: 'blue',
        });
        closeModal();

        // TODO: UNCOMMENT AFTER BACKEND FIXES FOR SUCCESS: FALSE ON EMAIL ERRORS!
        // if (!res.success) {
        //   if (res.data?.inviteUsers.length) {
        //     for (const inviteData of res.data.inviteUsers) {
        //       if (inviteData.errorMessage) {
        //        const errorMessage = `${inviteData.email}: ${inviteData.errorMessage}`;
        //        notifications.show({
        //          title: tGeneric('error'),
        //          message: errorMessage,
        //          color: 'red',
        //         });
        //       }
        //     }
        //   }
        // } else {
        // notifications.show({
        //   title: tGeneric('success'),
        //   message: t('inviteSuccess'),
        //   color: 'blue',
        // });
        // closeModal();
        // }
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <Flex>
      <Button
        leftSection={<IconUserPlus size={18} />}
        color={theme.colors.blue[7]}
        variant="outline"
        onClick={open}
        disabled={(!isOrgAdmin(userDetails.allRoles) && !isOperator(userDetails.allRoles)) || props.isPending}
      >
        {t('inviteUsers')}
      </Button>

      {/* Delete Modal */}
      <Modal opened={opened} onClose={closeModal} title={t('inviteUsers')} centered>
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
          <Button color="blue" disabled={!emails.length || isPending} onClick={performUserInvites}>
            {t('invite')}
          </Button>
        </Flex>
      </Modal>
    </Flex>
  );
}
