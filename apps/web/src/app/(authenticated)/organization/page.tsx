import React from 'react';
import { Flex } from '@mantine/core';
import DeleteOrganizationButton from '@/app/(authenticated)/organization/components/delete-organization-button';
import NameEdit from './components/name-edit';
// import { UsersTable } from './components/users-table';

export default function Organization(): React.ReactNode {
  return (
    <Flex direction="column" gap="md" w="100%">
      <NameEdit />
      {/*<UsersTable members={members} />*/}
      <DeleteOrganizationButton />
    </Flex>
  );
}
