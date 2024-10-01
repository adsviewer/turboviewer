'use client';

import {
  Avatar,
  Table,
  Group,
  Text,
  ActionIcon,
  Menu,
  rem,
  Select,
  Box,
  LoadingOverlay,
  Flex,
  Tooltip,
} from '@mantine/core';
import { IconTrash, IconDots, IconRefresh } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { logger } from '@repo/logger';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { tierConstraints } from '@repo/mappings';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import { AllRoles, OrganizationRoleEnum, UserOrganizationStatus } from '@/graphql/generated/schema-server';
import { addOrReplaceURLParams, urlKeys } from '@/util/url-query-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { isMember, isOperator, isOrgAdmin } from '@/util/access-utils';
import getOrganization, { removeUserFromOrganization, updateOrganizationUser } from '../actions';
import { getUserDetails } from '../../actions';

interface RolesDataType {
  value: OrganizationRoleEnum;
  label: string;
}

export function UsersTable(): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const tOrganization = useTranslations('organization');
  const tProfile = useTranslations('profile');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [organization, setOrganization] = useAtom(organizationAtom);
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  const [rolesData, setRolesData] = useState<RolesDataType[]>([]);
  const [isPending, setIsPending] = useState<boolean>(false);
  const roleToRoleTitleMap = useMemo(() => {
    return {
      ORG_ADMIN: tProfile('roleAdmin'),
      ORG_OPERATOR: tProfile('roleOperator'),
      ORG_MEMBER: tProfile('roleUser'),
    };
  }, [tProfile]);

  const setRolesDataOptions = useCallback(
    (userRoles: AllRoles[]): void => {
      // Members can't change any roles
      if (userRoles.includes(AllRoles.ORG_MEMBER)) {
        setRolesData([]);
      }
      // Operators can only change role to member and operator
      else if (userRoles.includes(AllRoles.ORG_OPERATOR)) {
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
    },
    [roleToRoleTitleMap],
  );

  const refreshMembers = useCallback((): void => {
    setIsPending(true);
    void getOrganization()
      .then((orgRes) => {
        if (orgRes.data) {
          // We need to re-fetch the logged in user's details since the user's role might've changed
          void getUserDetails()
            .then((userRes) => {
              setUserDetails(userRes);
              setRolesDataOptions(userRes.allRoles);
              setOrganization(orgRes.data);
            })
            .catch((error: unknown) => {
              logger.error(error);
            });
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [setOrganization, setRolesDataOptions, setUserDetails]);

  useEffect(() => {
    refreshMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- safe workaround since infinite loop occurs when adding refreshMembers to deps
  }, []);

  const changeUserRole = (userId: string, newRole: string | null): void => {
    if (newRole) {
      setIsPending(true);
      void updateOrganizationUser({ userId, role: newRole as OrganizationRoleEnum })
        .then((res) => {
          if (!res.success) {
            logger.error(res.error);
            const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.error, String(res.error));
            router.replace(newURL);
          }
          refreshMembers();
        })
        .catch((err: unknown) => {
          logger.error(err);
        })
        .finally(() => {
          setIsPending(false);
        });
    }
  };

  const removeUser = (userId: string): void => {
    setIsPending(true);
    void removeUserFromOrganization({ userId })
      .then((res) => {
        if (!res.success) {
          logger.error(res.error);
          const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.error, String(res.error));
          router.replace(newURL);
          return;
        }
        refreshMembers();
      })
      .catch((err: unknown) => {
        logger.error(err);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const rows = organization?.organization.userOrganizations.map((userData) => (
    <Table.Tr key={userData.user.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar size={40} src={userData.user.photoUrl} radius={40} />
          <div>
            <Text fz="sm" fw={500}>
              {userData.user.firstName && userData.user.lastName
                ? `${userData.user.firstName} ${userData.user.lastName}`
                : userData.user.email}
            </Text>
            <Text c="dimmed" fz="xs">
              {roleToRoleTitleMap[userData.role]}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text fz="sm">{userData.user.email}</Text>
      </Table.Td>
      <Table.Td>
        <Flex gap="sm" align="center">
          {!isMember(userDetails.allRoles) &&
          (isOrgAdmin(userDetails.allRoles) || (isOperator(userDetails.allRoles) && !isOrgAdmin([userData.role]))) ? (
            <Select
              data={rolesData}
              value={userData.role}
              variant="filled"
              allowDeselect={false}
              withCheckIcon
              comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
              onChange={(value) => {
                changeUserRole(userData.userId, value);
              }}
            />
          ) : null}

          {userData.status === UserOrganizationStatus.INVITED ? (
            <Text fs="italic" c="dimmed">
              {tOrganization('invited')}
            </Text>
          ) : null}
        </Flex>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          {userDetails.id === userData.userId ||
          (!isMember(userDetails.allRoles) &&
            (isOrgAdmin(userDetails.allRoles) ||
              (isOperator(userDetails.allRoles) && !isOrgAdmin([userData.role])))) ? (
            <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                  color="red"
                  onClick={() => {
                    removeUser(userData.userId);
                  }}
                >
                  {tGeneric('remove')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : null}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Flex align="flex-end" gap="xs">
        <Text mt="md">{tOrganization('organizationMembers')}</Text>
        <Tooltip label={tGeneric('refresh')} disabled={isPending}>
          <ActionIcon
            variant="default"
            size="md"
            onClick={refreshMembers}
            style={{ cursor: 'pointer' }}
            loading={isPending}
          >
            <IconRefresh size={20} />
          </ActionIcon>
        </Tooltip>

        {organization?.organization.userOrganizations.length ? (
          <Text c="dimmed" ml="auto" size="sm">
            {organization.organization.userOrganizations.length} /{' '}
            {String(tierConstraints[organization.organization.tier].maxUsers)} {tOrganization('organizationMembers')}
          </Text>
        ) : null}
      </Flex>

      <Box pos="relative" mih={120}>
        <LoadingOverlay visible={isPending} zIndex={1000} overlayProps={{ blur: 2 }} />
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm" withTableBorder>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>
    </>
  );
}
