'use client';

import { Flex, Button, Modal, useMantineTheme, PillsInput, Pill, Select, Tooltip } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { IconUserPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { z } from 'zod';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { canAddUser } from '@repo/mappings';
import { isOperator, isOrgAdmin } from '@/util/access-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { AllRoles, OrganizationRoleEnum, Tier } from '@/graphql/generated/schema-server';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import getOrganization, { inviteUsers } from '../actions';

const emailSchema = z.string().email();

export interface PropsType {
  isPending: boolean;
}

interface RolesDataType {
  value: OrganizationRoleEnum;
  label: string;
}

export default function InviteUsersButton(props: PropsType): React.ReactNode {
  const t = useTranslations('organization');
  const tGeneric = useTranslations('generic');
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const userDetails = useAtomValue(userDetailsAtom);
  const [organization, setOrganization] = useAtom(organizationAtom);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInputValue, setEmailInputValue] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<OrganizationRoleEnum>(OrganizationRoleEnum.ORG_MEMBER);
  const [rolesData, setRolesData] = useState<RolesDataType[]>([]);
  const [isPending, setIsPending] = useState<boolean>(false);
  const roleToRoleTitleMap = {
    ORG_ADMIN: tGeneric('roleAdmin'),
    ORG_OPERATOR: tGeneric('roleOperator'),
    ORG_MEMBER: tGeneric('roleMember'),
  };

  const openModal = (): void => {
    logger.info(organization);
    setRolesDataOptions();
    open();
  };

  const setRolesDataOptions = (): void => {
    if (userDetails.allRoles.includes(AllRoles.ORG_OPERATOR)) {
      setRolesData([
        {
          value: OrganizationRoleEnum.ORG_OPERATOR,
          label: roleToRoleTitleMap[OrganizationRoleEnum.ORG_OPERATOR],
        },
        {
          value: OrganizationRoleEnum.ORG_MEMBER,
          label: roleToRoleTitleMap[OrganizationRoleEnum.ORG_MEMBER],
        },
      ]);
    }
    // Admins can change anyone to anything
    else {
      setRolesData([
        {
          value: OrganizationRoleEnum.ORG_ADMIN,
          label: roleToRoleTitleMap[OrganizationRoleEnum.ORG_ADMIN],
        },
        {
          value: OrganizationRoleEnum.ORG_OPERATOR,
          label: roleToRoleTitleMap[OrganizationRoleEnum.ORG_OPERATOR],
        },
        {
          value: OrganizationRoleEnum.ORG_MEMBER,
          label: roleToRoleTitleMap[OrganizationRoleEnum.ORG_MEMBER],
        },
      ]);
    }
  };

  const closeModal = (): void => {
    setEmails([]);
    setEmailInputValue('');
    setSelectedRole(OrganizationRoleEnum.ORG_MEMBER);
    setIsPending(false);
    close();
  };

  const onEmailInputChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmailInputValue(e.target.value);
  };

  const onEmailInputConfirm = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (emailInputValue !== '') {
      if (
        e.code === 'Space' ||
        e.code === 'Tab' ||
        e.code === 'Enter' ||
        e.code === 'Comma' ||
        e.code === 'NumpadEnter'
      ) {
        e.preventDefault();
        addEmail();
        return;
      }
    }

    if (!isPending && emails.length && (e.code === 'Enter' || e.code === 'NumpadEnter')) {
      performUserInvites();
    }
  };

  const addEmail = (): void => {
    if (emailSchema.safeParse(emailInputValue).success) {
      setEmails([...emails, emailInputValue]);
      setEmailInputValue('');
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

    void inviteUsers({ emails, role: selectedRole })
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

  const onRoleChanged = (role: string | null): void => {
    if (role) {
      setSelectedRole(role as OrganizationRoleEnum);
    }
  };

  return (
    <Flex>
      <Tooltip
        label={t('inviteUsersLimitHint')}
        disabled={canAddUser(
          organization?.organization.tier ?? Tier.Launch,
          organization?.organization.userOrganizations.length ?? 1,
        )}
      >
        <Button
          leftSection={<IconUserPlus size={18} />}
          color={theme.colors.blue[7]}
          variant="outline"
          onClick={openModal}
          disabled={
            (!isOrgAdmin(userDetails.allRoles) && !isOperator(userDetails.allRoles)) ||
            props.isPending ||
            !canAddUser(
              organization?.organization.tier ?? Tier.Launch,
              organization?.organization.userOrganizations.length ?? 1,
            )
          }
        >
          {t('inviteUsers')}
        </Button>
      </Tooltip>

      {/* Invite Modal */}
      <Modal opened={opened} onClose={closeModal} title={t('inviteUsers')} centered>
        <Flex direction="column" gap="sm">
          <PillsInput
            label={`${t('enterEmails')}:`}
            onChange={onEmailInputChanged}
            onKeyDown={onEmailInputConfirm}
            onBlur={addEmail}
          >
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
          <Select
            label={tGeneric('role')}
            comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
            data={rolesData}
            value={selectedRole}
            onChange={onRoleChanged}
          />
          <Button color="blue" disabled={!emails.length || isPending} onClick={performUserInvites}>
            {t('invite')}
          </Button>
        </Flex>
      </Modal>
    </Flex>
  );
}
