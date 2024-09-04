import { Button, Flex, Modal, Select, Text, CloseButton, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { logger } from '@repo/logger';
import { IconUserPlus } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState, type ReactNode } from 'react';
import { OrganizationRoleEnum } from '@/graphql/generated/schema-server';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import getOrganization from '@/app/(authenticated)/organization/actions';

interface SelectedUsersType {
  role: OrganizationRoleEnum;
  userId: string | null;
  key: number;
}

interface DropdownValueType {
  label: string;
  value: string;
  disabled: boolean;
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
  const [organization, setOrganization] = useAtom(organizationAtom);
  // const usersData: UserRolesInput[] = [];
  const [availableUsers, setAvailableUsers] = useState<DropdownValueType[]>([]);
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
    void getOrganization()
      .then((orgRes) => {
        if (orgRes.data) {
          setOrganization(orgRes.data);
          if (orgRes.data.organization.userOrganizations.length) {
            setAvailableUsers(
              orgRes.data.organization.userOrganizations.map((userData) => {
                return {
                  label: `${userData.user.firstName} ${userData.user.lastName}`,
                  value: userData.userId,
                  disabled: false,
                };
              }),
            );
          }
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
      });
  }, [setOrganization]);

  const closeModal = (): void => {
    close();
    // form.reset();
  };

  const resetUsers = (): void => {
    setUsers([]);
    if (organization) {
      setAvailableUsers(
        organization.organization.userOrganizations.map((userData) => {
          return {
            label: `${userData.user.firstName} ${userData.user.lastName}`,
            value: userData.userId,
            disabled: false,
          };
        }),
      );
    }
  };

  const handleSubmit = (): void => {
    closeModal();
    resetUsers();
  };

  const addUser = (): void => {
    const newUser = { ...INITIAL_USER_VALUE };
    let newKey = Math.random();
    while (keys.includes(newKey)) {
      newKey = Math.random();
    }
    keys = [...keys, newKey];
    newUser.key = newKey;
    setUsers([...users, newUser]);
  };

  const changeRole = (newRole: string, roleChangeIndex: number): void => {
    const updatedUsers = users.map((user, index) =>
      roleChangeIndex === index ? { ...user, role: newRole as OrganizationRoleEnum } : user,
    );
    setUsers(updatedUsers);
  };

  const changeUser = (newUserId: string, userChangeIndex: number): void => {
    setUsers(() => {
      const newUsers = users.map((user, index) => (userChangeIndex === index ? { ...user, userId: newUserId } : user));
      updateAvailableUsers(newUsers);
      return newUsers;
    });
  };

  const updateAvailableUsers = (updatedUsers: SelectedUsersType[]): void => {
    let updatedAvailableUsers: DropdownValueType[] = [];
    if (organization) {
      for (const userData of organization.organization.userOrganizations) {
        const userToAdd = {
          label: `${userData.user.firstName} ${userData.user.lastName}`,
          value: userData.userId,
          disabled: updatedUsers.some((currUser) => currUser.userId === userData.userId),
        };
        updatedAvailableUsers = [...updatedAvailableUsers, userToAdd];
      }
      setAvailableUsers(updatedAvailableUsers);
    }
  };

  const deleteUser = (deletedUserKey: number): void => {
    setUsers(() => {
      const updatedUsers = users.filter((user) => user.key !== deletedUserKey);
      updateAvailableUsers(updatedUsers);
      return updatedUsers;
    });
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
            addUser();
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
              onClick={() => {
                handleSubmit();
              }}
            >
              OK
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
