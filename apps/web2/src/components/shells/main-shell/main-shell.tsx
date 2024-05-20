'use client';

import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Burger,
  Divider,
  Flex,
  Group,
  NavLink,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconGraph, IconLogout, IconPlugConnected } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { LogoFull } from '@/components/misc/logo-full';
import ColorSchemeToggle from '@/components/buttons/color-scheme-toggle';
import GroupFilters from '@/app/(authenticated)/insights/components/group-filters';
import UserButton from '@/components/user-button/user-button';

export function MainAppShell({ children }: { children: React.ReactNode }): React.ReactNode {
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
          <Flex align="center" justify="flex-end" ml="auto" gap="sm">
            <ColorSchemeToggle />
          </Flex>
        </Group>
      </AppShellHeader>

      {/* Navbar */}
      <AppShellNavbar p="md">
        <Flex direction="column" h="100%">
          {/* Navigation */}
          <NavLink
            label="Insights"
            href="/insights"
            active={pathname === '/insights'}
            leftSection={<IconGraph size="1rem" stroke={1.5} />}
          />
          <NavLink
            label="Integrations"
            href="/integrations"
            active={pathname === '/integrations'}
            leftSection={<IconPlugConnected size="1rem" stroke={1.5} />}
          />

          {/* Group Filters (insights only) */}
          {pathname === '/insights' ? (
            <>
              <Divider mt="auto" />
              <GroupFilters />
            </>
          ) : null}

          {/* User */}
          <Flex direction="column" justify="flex-end" gap="md" mt="auto">
            <Divider />
            <UserButton firstName="test" lastName="guy" email="test@gmail.com" />
            <Divider />
            <NavLink label="Sign Out" href="/sign-out" leftSection={<IconLogout size="1rem" stroke={1.5} />} />
          </Flex>
        </Flex>
      </AppShellNavbar>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
