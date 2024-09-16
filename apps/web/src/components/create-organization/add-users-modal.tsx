import { Button, Flex, Modal, Select, Text, CloseButton, ScrollArea, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { logger } from '@repo/logger';
import { IconUserPlus } from '@tabler/icons-react';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrganizationRoleEnum, type UserRolesInput } from '@/graphql/generated/schema-server';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import getOrganization from '@/app/(authenticated)/organization/actions';
import { userDetailsAtom } from '@/app/atoms/user-atoms';

interface PropsType {
  setNewUsers: (users: UserRolesInput[]) => void;
}

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

const INITIAL_USER_VALUE: SelectedUsersType = {
  role: OrganizationRoleEnum.ORG_MEMBER,
  userId: null,
  key: 0,
};

export default function AddUsersModal(props: PropsType): ReactNode {
  const t = useTranslations('organization');
  const tGeneric = useTranslations('generic');
  const tProfile = useTranslations('profile');
  const [opened, { open, close }] = useDisclosure(false);
  const [organization, setOrganization] = useAtom(organizationAtom);
  const userDetails = useAtomValue(userDetailsAtom);
  const [availableUsers, setAvailableUsers] = useState<DropdownValueType[]>([]);
  const [users, setUsers] = useState<SelectedUsersType[]>([]);
  const [keys, setKeys] = useState<number[]>([]);
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const updateAvailableUsers = useCallback(
    (updatedUsers: SelectedUsersType[]): void => {
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
    },
    [organization],
  );

  const addUser = useCallback(
    (userId?: string, role?: OrganizationRoleEnum): void => {
      const newUser = { ...INITIAL_USER_VALUE };
      let newKey = Math.random();
      while (keys.includes(newKey)) {
        newKey = Math.random();
      }
      setKeys([...keys, newKey]);
      newUser.key = newKey;
      newUser.userId = userId ? userId : null;
      newUser.role = role ? role : OrganizationRoleEnum.ORG_MEMBER;
      setUsers(() => {
        const newUsers = [...users, newUser];
        updateAvailableUsers(newUsers);
        setTimeout(() => {
          scrollAreaRef.current
            ? scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' })
            : null;
        }, 100);
        return [...users, newUser];
      });
    },
    [keys, updateAvailableUsers, users],
  );

  const changeRole = (newRole: string, roleChangeIndex: number): void => {
    const updatedUsers = users.map((user, index) =>
      roleChangeIndex === index ? { ...user, role: newRole as OrganizationRoleEnum } : user,
    );
    setUsers(updatedUsers);
  };

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

            // Initial users should contain the current user
            addUser(userDetails.id, OrganizationRoleEnum.ORG_ADMIN);
          }
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- works as intended - if the dependency is added it keeps calling it self infinitely, not sure if possible to fix this.
  }, [setOrganization, userDetails.id]);

  const closeModal = (): void => {
    close();
  };

  const handleSubmit = (): void => {
    props.setNewUsers(users as UserRolesInput[]);
    closeModal();
  };

  const changeUser = (newUserId: string, userChangeIndex: number): void => {
    setUsers(() => {
      const newUsers = users.map((user, index) => (userChangeIndex === index ? { ...user, userId: newUserId } : user));
      updateAvailableUsers(newUsers);
      return newUsers;
    });
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
        <Tooltip label={t('addUsersNoUsersHint')} disabled={organization?.organization.userOrganizations.length !== 1}>
          <Button
            variant="light"
            fullWidth
            leftSection={<IconUserPlus size={16} />}
            onClick={open}
            disabled={organization?.organization.userOrganizations.length === 1}
          >
            {t('addUsers')}
          </Button>
        </Tooltip>
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
            <ScrollArea.Autosize mah={400} offsetScrollbars type="always" viewportRef={scrollAreaRef}>
              <AnimatePresence>
                {users.length
                  ? users.map((userData, index) => {
                      return (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={userData.key}
                        >
                          <Flex gap="md" mt={10} align="center">
                            <Select
                              data={availableUsers}
                              value={userData.userId ? userData.userId : null}
                              disabled={index === 0}
                              description={tGeneric('user')}
                              placeholder={tGeneric('user')}
                              allowDeselect={false}
                              onChange={(e) => {
                                if (e) changeUser(e, index);
                              }}
                              comboboxProps={{
                                shadow: 'sm',
                                transitionProps: { transition: 'fade-down', duration: 200 },
                              }}
                            />
                            <Select
                              data={rolesData}
                              defaultValue={OrganizationRoleEnum.ORG_MEMBER}
                              value={userData.role}
                              disabled={index === 0}
                              description={tGeneric('role')}
                              allowDeselect={false}
                              onChange={(e) => {
                                if (e) changeRole(e, index);
                              }}
                              comboboxProps={{
                                shadow: 'sm',
                                transitionProps: { transition: 'fade-down', duration: 200 },
                              }}
                            />
                            <CloseButton
                              mt={18}
                              onClick={() => {
                                deleteUser(userData.key);
                              }}
                              disabled={index === 0}
                            />
                          </Flex>
                        </motion.div>
                      );
                    })
                  : null}
              </AnimatePresence>
            </ScrollArea.Autosize>
          </Flex>
          <Flex direction="column" gap="xs" mt="xl">
            <Button
              type="button"
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
