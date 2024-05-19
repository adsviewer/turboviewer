'use client';

import { AppShell, AppShellHeader, AppShellMain, AppShellNavbar, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MantineLogo } from '@mantinex/mantine-logo';
import { type ReactNode } from 'react';

export function MainAppShell({ children }: { children: React.ReactNode }): ReactNode {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShellHeader>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <MantineLogo size={30} />
        </Group>
      </AppShellHeader>
      <AppShellNavbar p="md">Navbar</AppShellNavbar>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
