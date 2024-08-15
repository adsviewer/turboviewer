'use client';

import { Group, Avatar, Text, Flex } from '@mantine/core';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { getUserDetails } from '@/app/(authenticated)/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { type Integration } from '@/graphql/generated/schema-server';
import { isTokenCloseToExpiration } from '@/util/integration-utils';
import classes from './user-button.module.scss';

export default function UserButton(): ReactNode {
  const tGeneric = useTranslations('generic');
  const tIntegrations = useTranslations('integrations');
  const router = useRouter();
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const checkIntegrationTokensForExpiration = useCallback(
    (integrationsData: Integration[] | null): void => {
      if (integrationsData) {
        for (const integration of integrationsData) {
          if (isTokenCloseToExpiration(integration.accessTokenExpiresAt)) {
            notifications.show({
              title: tGeneric('warning'),
              message: `(${integration.type}) ${tIntegrations('tokenWarning')}`,
              color: 'orange',
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
        logger.info(res);

        checkIntegrationTokensForExpiration(res.currentOrganization?.integrations as Integration[] | null);
        setUserDetails(res);
        setIsDataLoaded(true);
      })
      .catch((error: unknown) => {
        logger.error(error);
      });
  }, [checkIntegrationTokensForExpiration, setUserDetails]);

  const redirectToProfile = (): void => {
    router.push('profile');
  };

  return (
    <Flex justify="flex-start" className={classes.user}>
      {isDataLoaded ? (
        <Group onClick={redirectToProfile}>
          <Avatar src={userDetails.photoUrl} radius="xl" />

          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500}>
              {`${userDetails.firstName} ${userDetails.lastName}`}
            </Text>

            <Text c="dimmed" size="xs">
              {userDetails.email}
            </Text>
          </div>
        </Group>
      ) : (
        <LoaderCentered />
      )}
    </Flex>
  );
}
