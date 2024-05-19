'use client';

import { AppShell, AppShellHeader, AppShellMain, AppShellNavbar, Burger, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type ReactNode } from 'react';
import { IconGraph, IconSettings } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { LogoFull } from '@/components/misc/logo-full';

export function MainAppShell({ children }: { children: React.ReactNode }): ReactNode {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShellHeader>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <LogoFull />
        </Group>
      </AppShellHeader>
      <AppShellNavbar p="md">
        <NavLink
          label="Insights"
          href="/insights"
          active={pathname === '/insights'}
          leftSection={<IconGraph size="1rem" stroke={1.5} />}
        />
        <NavLink
          label="Settings"
          href="/settings"
          active={pathname === '/settings'}
          leftSection={<IconSettings size="1rem" stroke={1.5} />}
        />
      </AppShellNavbar>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
