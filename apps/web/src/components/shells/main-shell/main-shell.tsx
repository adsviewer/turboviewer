'use client';

import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Burger,
  Divider,
  Flex,
  NavLink,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBuilding, IconGraph, IconLogout, IconPlugConnected } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAtomValue } from 'jotai/index';
import { LogoFull } from '@/components/misc/logo-full';
import SettingsButton from '@/components/buttons/settings-button';
import GroupFilters from '@/app/(authenticated)/insights/components/group-filters';
import UserButton from '@/components/user-button/user-button';
import NavlinkButton from '@/components/buttons/navlink-button/navlink-button';
import OrganizationSelect from '@/components/dropdowns/organization-select/organization-select';
import CreateOrganizationButton from '@/components/buttons/create-organization-button';
import { userDetailsAtom } from '@/app/atoms/user-atoms';

export function MainAppShell({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('navbar');
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const userDetails = useAtomValue(userDetailsAtom);

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
    {
      iconNode: <IconBuilding />,
      label: t('organization'),
      href: '/organization',
      isActive: pathname === '/organization',
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
            <OrganizationSelect />
            <CreateOrganizationButton />
            <SettingsButton />
          </Flex>
        </Flex>
      </AppShellHeader>

      {/* Navbar */}
      <AppShellNavbar p="md">
        <Flex direction="column" h="100%">
          {/* Navigation */}
          {navLinksData.length && userDetails.currentOrganization?.id ? (
            navLinksData.map((navLink) => (
              <NavlinkButton
                key={navLink.href}
                iconNode={navLink.iconNode}
                label={navLink.label}
                href={navLink.href}
                isActive={pathname === navLink.href}
              />
            ))
          ) : (
            <Text ta="center" c="dimmed">
              {t('noOrganizationData')}
            </Text>
          )}

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
