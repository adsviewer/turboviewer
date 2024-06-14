import React from 'react';
import { Flex } from '@mantine/core';
import { getUserDetails } from '../actions';
import NameEdit from './components/name-edit';

export default async function Organization(): Promise<React.ReactNode> {
  const userDetails = await getUserDetails();

  return (
    <Flex direction="column" gap="md" w="100%">
      <NameEdit userDetails={userDetails} />
    </Flex>
  );
}
