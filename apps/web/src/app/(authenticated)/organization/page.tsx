import React from 'react';
import { Flex } from '@mantine/core';
import { getUserDetails } from '../actions';
import NameEdit from './components/name-edit';
// import { UsersTable } from './components/users-table';

export default async function Organization(): Promise<React.ReactNode> {
  const userDetails = await getUserDetails();
  // const members = await getUserDetails();

  return (
    <Flex direction="column" gap="md" w="100%">
      <NameEdit userDetails={userDetails} />
      {/*<UsersTable members={members} />*/}
    </Flex>
  );
}
