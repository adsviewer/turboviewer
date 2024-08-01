'use client';

import { Avatar, Table, Group, Text, ActionIcon, Menu, rem, Select } from '@mantine/core';
import { IconTrash, IconDots } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import { OrganizationRoleEnum } from '@/graphql/generated/schema-server';
import getOrganization from '../actions';

export function UsersTable(): React.ReactNode {
  const tGeneric = useTranslations('generic');
  const tOrganization = useTranslations('organization');
  const tProfile = useTranslations('profile');
  const [organization, setOrganization] = useAtom(organizationAtom);
  const roleToRoleTitleMap: Record<string, string> = {
    ORG_ADMIN: tProfile('roleAdmin'),
    ORG_OPERATOR: tProfile('roleOperator'),
    ORG_MEMBER: tProfile('roleUser'),
  };

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
    void getOrganization().then((res) => {
      if (res.data) {
        setOrganization(res.data);
      }
    });
  }, [setOrganization]);

  const rows = organization?.organization.userOrganizations.map((userData) => (
    <Table.Tr key={userData.user.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar size={40} src={userData.user.photoUrl} radius={40} />
          <div>
            <Text fz="sm" fw={500}>
              {`${userData.user.firstName} ${userData.user.lastName}`}
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
        <Select data={rolesData} defaultValue={userData.role} variant="filled" allowDeselect={false} />
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
      <Table.ScrollContainer minWidth={800}>
        <Table verticalSpacing="sm" withTableBorder>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
}
