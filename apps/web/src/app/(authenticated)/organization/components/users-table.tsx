'use client';

import { Avatar, Table, Group, Text, ActionIcon, Menu, rem, Select, Box, LoadingOverlay, Flex } from '@mantine/core';
import { IconTrash, IconDots } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { logger } from '@repo/logger';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { sentenceCase } from 'change-case';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import { OrganizationRoleEnum, UserOrganizationStatus } from '@/graphql/generated/schema-server';
import { addOrReplaceURLParams, errorKey } from '@/util/url-query-utils';
import getOrganization, { updateOrganizationUser } from '../actions';

export function UsersTable(): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const tOrganization = useTranslations('organization');
  const tProfile = useTranslations('profile');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [organization, setOrganization] = useAtom(organizationAtom);
  const roleToRoleTitleMap: Record<string, string> = {
    ORG_ADMIN: tProfile('roleAdmin'),
    ORG_OPERATOR: tProfile('roleOperator'),
    ORG_MEMBER: tProfile('roleUser'),
  };
  const [isPending, setIsPending] = useState<boolean>(false);

  const rolesData = [
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
  ];

  useEffect(() => {
    setOrganization(null);
    void getOrganization().then((res) => {
      logger.info(res);
      if (res.data) {
        setOrganization(res.data);
      }
    });
  }, [setOrganization]);

  const changeUserRole = (userId: string, newRole: string | null): void => {
    if (newRole) {
      setIsPending(true);
      void updateOrganizationUser({ userId, role: newRole as OrganizationRoleEnum })
        .then((res) => {
          logger.info(res);
          if (!res.success) {
            logger.error(res.error);
            const newURL = addOrReplaceURLParams(pathname, searchParams, errorKey, String(res.error));
            router.replace(newURL);
          }

          // Fetch members data again
          setOrganization(null);
          void getOrganization().then((orgRes) => {
            if (orgRes.data) {
              setOrganization(orgRes.data);
            }
          });
        })
        .catch((err: unknown) => {
          logger.error(err);
        })
        .finally(() => {
          setIsPending(false);
        });
    }
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
          <Select
            data={rolesData}
            defaultValue={userData.role}
            variant="filled"
            allowDeselect={false}
            onChange={(value) => {
              changeUserRole(userData.userId, value);
            }}
          />
          {userData.status === UserOrganizationStatus.INVITED ? (
            <Text fs="italic">{sentenceCase(UserOrganizationStatus.INVITED)}</Text>
          ) : null}
        </Flex>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
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
              >
                {tGeneric('remove')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Text mt="md">{tOrganization('organizationMembers')}</Text>

      <Box pos="relative">
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
