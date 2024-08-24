'use client';

import { AppShell, AppShellHeader, AppShellMain, AppShellNavbar, Burger, Divider, Flex, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserBolt, IconLogout } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { LogoFull } from '@/components/misc/logo-full';
import SettingsButton from '@/components/buttons/settings-button';
import UserButton from '@/components/user-button/user-button';
import NavlinkButton from '@/components/buttons/navlink-button/navlink-button';

export function MainAppShell({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('navbar');
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  const navLinksData = [
    {
      iconNode: <IconUserBolt />,
      label: t('emulate'),
      href: '/emulate',
      isActive: pathname === '/insights',
    },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShellHeader>
        <Flex h="100%" mx="md" align="center" justify="space-between">
          <Flex mr="md" align="center">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <LogoFull />
          </Flex>
          <Flex align="center" justify="flex-end" ml="auto" gap="sm">
            <SettingsButton />
          </Flex>
        </Flex>
      </AppShellHeader>

      {/* Navbar */}
      <AppShellNavbar p="md">
        <Flex direction="column" h="100%">
          {/* Navigation */}
          {navLinksData.map((navLink) => (
            <NavlinkButton
              key={navLink.href}
              iconNode={navLink.iconNode}
              label={navLink.label}
              href={navLink.href}
              isActive={pathname === navLink.href}
            />
          ))}

          {/* User */}
          <Flex direction="column" justify="flex-end" gap="md" mt="auto">
            <Divider />
            <UserButton />
            <Divider />
            <NavLink label={t('signOut')} href="/api/sign-out" leftSection={<IconLogout size="1rem" stroke={1.5} />} />
          </Flex>
        </Flex>
      </AppShellNavbar>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
