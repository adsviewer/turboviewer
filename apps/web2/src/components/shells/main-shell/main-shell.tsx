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
import { Suspense } from 'react';
import { LogoFull } from '@/components/misc/logo-full';
import ColorSchemeToggle from '@/components/buttons/color-scheme-toggle';
import GroupFilters from '@/app/(authenticated)/insights/components/group-filters';
import UserButton from '@/components/user-button/user-button';
import NavlinkButton from '@/components/buttons/navlink-button/navlink-button';
import LoaderCentered from '@/components/misc/loader-centered';

export function MainAppShell({ children }: { children: React.ReactNode }): React.ReactNode {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  const navLinksData = [
    {
      id: 1,
      iconNode: <IconGraph />,
      label: 'Insights',
      href: '/insights',
      isActive: pathname === '/insights',
    },
    {
      id: 2,
      iconNode: <IconPlugConnected />,
      label: 'Integrations',
      href: '/integrations',
      isActive: pathname === '/integrations',
    },
  ];

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
          {navLinksData.length
            ? navLinksData.map((navLink) => (
                <NavlinkButton
                  key={navLink.id}
                  iconNode={navLink.iconNode}
                  label={navLink.label}
                  href={navLink.href}
                  isActive={pathname === navLink.href}
                />
              ))
            : null}

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
            <UserButton />
            <Divider />
            <NavLink label="Sign Out" href="/sign-out" leftSection={<IconLogout size="1rem" stroke={1.5} />} />
          </Flex>
        </Flex>
      </AppShellNavbar>
      <AppShellMain>
        <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
      </AppShellMain>
    </AppShell>
  );
}
