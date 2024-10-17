import { Flex, Select } from '@mantine/core';
import React from 'react';
import Save from './save';
import Delete from './delete';

export default function SavedSearches(): React.ReactNode {
  return (
    <Flex gap="sm" align="center">
      <Select description="Saved searches" placeholder="Saved searches" w={200} mb="lg" />
      <Save />
      <Delete />
    </Flex>
  );
}
