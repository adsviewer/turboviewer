'use client';

import React from 'react';
import { Flex } from '@mantine/core';
import { useAtomValue } from 'jotai/index';
import _ from 'lodash';
import { initialUserDetails, userDetailsAtom } from '@/app/atoms/user-atoms';
import DeleteOrganizationButton from '@/app/(authenticated)/organization/components/delete-organization-button';
import LoaderCentered from '@/components/misc/loader-centered';
import NameEdit from './components/name-edit';
// import { UsersTable } from './components/users-table';

export default function Organization(): React.ReactNode {
  const userDetails = useAtomValue(userDetailsAtom);
  return (
    <Flex direction="column" gap="md" w="100%">
      {!_.isEqual(userDetails, initialUserDetails) ? (
        <>
          <NameEdit />
          {/*<UsersTable members={members} />*/}
          <DeleteOrganizationButton />
        </>
      ) : (
        <LoaderCentered />
      )}
    </Flex>
  );
}
