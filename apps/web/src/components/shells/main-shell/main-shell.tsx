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
import { useAtom } from 'jotai/index';
import uniqid from 'uniqid';
import { useCallback, useEffect, useState } from 'react';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { LogoFull } from '@/components/misc/logo-full';
import SettingsButton from '@/components/buttons/settings-button';
import GroupFilters from '@/app/(authenticated)/insights/components/group-filters';
import UserButton from '@/components/user-button/user-button';
import NavlinkButton from '@/components/buttons/navlink-button/navlink-button';
import OrganizationSelect from '@/components/dropdowns/organization-select/organization-select';
import CreateOrganizationButton from '@/components/create-organization/create-organization-button';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import FeedbackButton from '@/components/buttons/feedback-button';
import SubNavlinkButton from '@/components/buttons/sub-navlink-button/sub-navlink-button';
import { getUserDetails } from '@/app/(authenticated)/actions';
import { type Integration, IntegrationStatus } from '@/graphql/generated/schema-server';
import LoaderCentered from '@/components/misc/loader-centered';

export function MainAppShell({ children }: { children: React.ReactNode }): React.ReactNode {
  const t = useTranslations('navbar');
  const tGeneric = useTranslations('generic');
  const tIntegrations = useTranslations('integrations');
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const navLinksData = [
    {
      iconNode: <IconGraph />,
      label: t('insights'),
      href: '/summary',
      isActive: pathname === '/summary',
      subLinks: [
        { label: t('summary'), href: '/summary' },
        { label: t('analytical'), href: '/insights' },
      ],
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

  const checkIntegrationTokensForExpiration = useCallback(
    (integrationsData: Integration[] | null): void => {
      if (integrationsData) {
        for (const integration of integrationsData) {
          if (integration.status === IntegrationStatus.Expiring) {
            notifications.show({
              title: tGeneric('warning'),
              message: `(${integration.type}) ${tIntegrations('tokenWarning')}`,
              color: 'orange',
              autoClose: false,
            });
          } else if (integration.status === IntegrationStatus.Errored) {
            notifications.show({
              title: tGeneric('error'),
              message: `(${integration.type}) ${tIntegrations('erroredIntegrationWarning')}`,
              color: 'red',
              autoClose: false,
            });
          }
        }
      }
    },
    [tGeneric, tIntegrations],
  );

  useEffect(() => {
    void getUserDetails()
      .then((res) => {
        setUserDetails(res);
        checkIntegrationTokensForExpiration(res.currentOrganization?.integrations as Integration[] | null);
        setIsDataLoaded(true);
      })
      .catch((error: unknown) => {
        logger.error(error);
      });
  }, [checkIntegrationTokensForExpiration, setUserDetails]);

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
            <Divider orientation="vertical" />
            <FeedbackButton />
          </Flex>
        </Flex>
      </AppShellHeader>

      {/* Navbar */}
      <AppShellNavbar p="md">
        <Flex direction="column" h="100%">
          {/* Navigation */}
          {navLinksData.length && userDetails.currentOrganization?.id ? (
            navLinksData.map((navLink) => {
              let isSublinkActive = false;
              let nodesToRender: React.ReactNode[] = [];

              // Handle sublinks
              let subLinksNodes: React.ReactNode[] = [];
              if (navLink.subLinks?.length) {
                for (const subLinkData of navLink.subLinks) {
                  if (pathname === subLinkData.href) isSublinkActive = true;
                  subLinksNodes = [
                    ...subLinksNodes,
                    <SubNavlinkButton
                      label={subLinkData.label}
                      href={subLinkData.href}
                      isActive={pathname === subLinkData.href}
                      key={uniqid()}
                    />,
                  ];
                }
              }

              const MAIN_LINK_NODE = (
                <NavlinkButton
                  key={uniqid()}
                  iconNode={navLink.iconNode}
                  label={navLink.label}
                  href={navLink.href}
                  isActive={pathname === navLink.href || isSublinkActive}
                />
              );
              nodesToRender = [MAIN_LINK_NODE];
              nodesToRender = [...nodesToRender, ...subLinksNodes];
              return (
                <Flex key={uniqid()} direction="column">
                  {nodesToRender}
                </Flex>
              );
            })
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
            <UserButton isDataLoaded={isDataLoaded} />
            <Divider />
            <NavLink
              label={t('signOut')}
              href="/api/auth/sign-out"
              leftSection={<IconLogout size="1rem" stroke={1.5} />}
            />
          </Flex>
        </Flex>
      </AppShellNavbar>
      <AppShellMain>{isDataLoaded ? children : <LoaderCentered />}</AppShellMain>
    </AppShell>
  );
}
