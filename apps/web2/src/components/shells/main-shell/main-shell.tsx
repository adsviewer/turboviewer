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
import { useTranslations } from 'next-intl';
import { LogoFull } from '@/components/misc/logo-full';
import SettingsButton from '@/components/buttons/settings-button';
import GroupFilters from '@/app/(authenticated)/insights/components/group-filters';
import UserButton from '@/components/user-button/user-button';
import NavlinkButton from '@/components/buttons/navlink-button/navlink-button';

export function MainAppShell({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('navbar');
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  const navLinksData = [
    {
      iconNode: <IconGraph />,
      label: t('insights'),
      href: '/insights',
      isActive: pathname === '/insights',
    },
    {
      iconNode: <IconPlugConnected />,
      label: t('integrations'),
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
            <SettingsButton />
          </Flex>
        </Group>
      </AppShellHeader>

      {/* Navbar */}
      <AppShellNavbar p="md">
        <Flex direction="column" h="100%">
          {/* Navigation */}
          {navLinksData.length
            ? navLinksData.map((navLink, index) => (
                <NavlinkButton
                  // eslint-disable-next-line react/no-array-index-key -- using the index as key is safe here
                  key={index}
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
              <Divider my="sm" />
              <GroupFilters />
            </>
          ) : null}

          {/* User */}
          <Flex direction="column" justify="flex-end" gap="md" mt="auto">
            <Divider />
            <UserButton />
            <Divider />
            <NavLink label={t('signOut')} href="/sign-out" leftSection={<IconLogout size="1rem" stroke={1.5} />} />
          </Flex>
        </Flex>
      </AppShellNavbar>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
