'use client';

import { type ReactNode, useEffect } from 'react';
import { Flex, Loader } from '@mantine/core';
import { signOut } from '../actions';

export default function SignOut(): ReactNode {
  useEffect(() => {
    void signOut();
  }, []);

  return (
    <Flex justify="center" align="center" p={200}>
      <Loader />
    </Flex>
  );
}
