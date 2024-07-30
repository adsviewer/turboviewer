'use client';

import React, { useState } from 'react';
import { Divider, Flex } from '@mantine/core';
import { useAtomValue } from 'jotai/index';
import _ from 'lodash';
import { initialUserDetails, userDetailsAtom } from '@/app/atoms/user-atoms';
import DeleteOrganizationButton from '@/app/(authenticated)/organization/components/delete-organization-button';
import LoaderCentered from '@/components/misc/loader-centered';
import NameEdit from './components/name-edit';
import { UsersTable } from './components/users-table';
import InviteUsersButton from './components/invite-users-button';
// import { UsersTable } from './components/users-table';

export default function Organization(): React.ReactNode {
  const userDetails = useAtomValue(userDetailsAtom);
  const [isPending, setIsPending] = useState<boolean>(false);

  return (
    <Flex direction="column" gap="md" w="100%">
      {!_.isEqual(userDetails, initialUserDetails) ? (
        <>
          <NameEdit isPending={isPending} setIsPending={setIsPending} />
          <UsersTable />
          <InviteUsersButton isPending={isPending} />
          <Divider mt="xl" />
          <DeleteOrganizationButton isPending={isPending} />
        </>
      ) : (
        <LoaderCentered />
      )}
    </Flex>
  );
}
