'use client';

import { Flex, Button, Modal, useMantineTheme, PillsInput, Pill } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { IconUserPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { z } from 'zod';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { isOperator, isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { OrganizationRoleEnum } from '@/graphql/generated/schema-server';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import getOrganization, { inviteUsers } from '../actions';

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
  const setOrganization = useSetAtom(organizationAtom);
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

  const refreshMembers = (): void => {
    void getOrganization()
      .then((orgRes) => {
        if (orgRes.data) {
          setOrganization(orgRes.data);
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
      });
  };

  const performUserInvites = (): void => {
    setIsPending(true);

    void inviteUsers({ emails, role: DEFAULT_ROLE })
      .then((res) => {
        logger.info(res);
        if (!res.success) {
          if (typeof res.error !== 'string' && res.error.length) {
            for (const inviteData of res.error) {
              if (inviteData.message) {
                const errorMessage = `${inviteData.email}: ${inviteData.message}`;
                notifications.show({
                  title: tGeneric('error'),
                  message: errorMessage,
                  color: 'red',
                });
              }
            }
          }
        } else {
          refreshMembers();
          notifications.show({
            title: tGeneric('success'),
            message: t('inviteSuccess'),
            color: 'blue',
          });
          closeModal();
        }
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
