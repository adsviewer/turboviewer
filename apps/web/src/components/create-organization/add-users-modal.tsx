import { Button, type ComboboxData, Flex, Modal, Select, Text, CloseButton, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { logger } from '@repo/logger';
import { IconUserPlus } from '@tabler/icons-react';
import { useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState, type ReactNode } from 'react';
import { OrganizationRoleEnum } from '@/graphql/generated/schema-server';
import { organizationAtom } from '@/app/atoms/organization-atoms';

interface SelectedUsersType {
  role: OrganizationRoleEnum;
  userId: string | null;
  key: number;
}

const INITIAL_USER_VALUE = {
  role: OrganizationRoleEnum.ORG_MEMBER,
  userId: null,
  key: 0,
};

export default function AddUsersModal(): ReactNode {
  const t = useTranslations('organization');
  const tGeneric = useTranslations('generic');
  const tProfile = useTranslations('profile');
  const [opened, { open, close }] = useDisclosure(false);
  const organization = useAtomValue(organizationAtom);
  // const usersData: UserRolesInput[] = [];
  const [availableUsers, setAvailableUsers] = useState<ComboboxData>([]);
  const [users, setUsers] = useState<SelectedUsersType[]>([]);
  let keys: number[] = [];
  const rolesData = [
    {
      label: tProfile('roleAdmin'),
      value: OrganizationRoleEnum.ORG_ADMIN,
    },
    {
      label: tProfile('roleOperator'),
      value: OrganizationRoleEnum.ORG_OPERATOR,
    },
    {
      label: tProfile('roleUser'),
      value: OrganizationRoleEnum.ORG_MEMBER,
    },
  ];

  useEffect(() => {
    if (organization?.organization.userOrganizations.length) {
      setAvailableUsers(
        organization.organization.userOrganizations.map((userData) => {
          return {
            label: `${userData.user.firstName} ${userData.user.lastName}`,
            value: userData.userId,
          };
        }),
      );
    }
  }, [organization?.organization.userOrganizations]);

  const closeModal = (): void => {
    close();
    // form.reset();
  };

  const handleSubmit = (): void => {
    logger.info(users);
    // closeModal();
  };

  const changeRole = (newRole: string, roleChangeIndex: number): void => {
    const updatedUsers = users.map((user, index) =>
      roleChangeIndex === index ? { ...user, role: newRole as OrganizationRoleEnum } : user,
    );
    setUsers(updatedUsers);
  };

  const changeUser = (newUser: string, roleChangeIndex: number): void => {
    const updatedUsers = users.map((user, index) => (roleChangeIndex === index ? { ...user, userId: newUser } : user));
    setUsers(updatedUsers);
  };

  const deleteUser = (deletedUserKey: number): void => {
    setUsers(users.filter((user) => user.key !== deletedUserKey));
  };

  return (
    <>
      <Flex align="center" my="sm">
        <Button variant="light" fullWidth leftSection={<IconUserPlus size={16} />} onClick={open}>
          {t('addUsers')}
        </Button>
      </Flex>

      {/* Modal */}
      <Modal opened={opened} onClose={closeModal} title={t('addUsers')} size="lg">
        <Text size="sm" c="dimmed" mb="md">
          {t('addUsersHint')}
        </Text>
        <Button
          variant="default"
          w={120}
          mb="md"
          leftSection={<IconUserPlus size={16} />}
          onClick={() => {
            const newUser = { ...INITIAL_USER_VALUE };
            let newKey = Math.random();
            while (keys.includes(newKey)) {
              newKey = Math.random();
            }
            keys = [...keys, newKey];
            newUser.key = newKey;
            setUsers([...users, newUser]);
          }}
        >
          {tGeneric('add')}
        </Button>
        <Flex direction="column">
          <Flex direction="column" w="100%">
            <ScrollArea.Autosize mah={400} offsetScrollbars type="always">
              {users.length
                ? users.map((userData, index) => {
                    return (
                      <Flex gap="md" mt={10} align="center" key={userData.key}>
                        <Select
                          data={availableUsers}
                          description={tGeneric('user')}
                          placeholder={tGeneric('user')}
                          allowDeselect={false}
                          onChange={(e) => {
                            if (e) changeUser(e, index);
                          }}
                          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                        />
                        <Select
                          data={rolesData}
                          defaultValue={OrganizationRoleEnum.ORG_MEMBER}
                          description={tGeneric('role')}
                          allowDeselect={false}
                          onChange={(e) => {
                            if (e) changeRole(e, index);
                          }}
                          comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
                        />
                        <CloseButton
                          mt={18}
                          onClick={() => {
                            deleteUser(userData.key);
                          }}
                        />
                      </Flex>
                    );
                  })
                : null}
            </ScrollArea.Autosize>
          </Flex>
          <Flex direction="column" gap="xs" mt="xl">
            <Button
              type="submit"
              leftSection={<IconUserPlus size={16} />}
              onClick={() => {
                handleSubmit();
              }}
            >
              {t('addUsers')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
