import React from 'react';
import { Flex } from '@mantine/core';
// import { getUserDetails } from '../actions';

export default async function Organization(): Promise<React.ReactNode> {
  // const userDetails = await getUserDetails();
  await Promise.resolve();

  return (
    <Flex direction="column" gap="md" w="100%">
      <div>hello</div>
    </Flex>
  );
}
