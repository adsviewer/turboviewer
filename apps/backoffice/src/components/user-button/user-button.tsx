'use client';

import { Avatar, Flex, Group, Text } from '@mantine/core';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { logger } from '@repo/logger';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { getUserDetails } from '@/app/actions';
import LoaderCentered from '@/components/misc/loader-centered';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { type Integration, IntegrationStatus } from '@/graphql/generated/schema-server';
import classes from './user-button.module.scss';

export default function UserButton(): ReactNode {
  const tGeneric = useTranslations('generic');
  const tIntegrations = useTranslations('integrations');
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

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
        setIsDataLoaded(true);
      })
      .catch((error: unknown) => {
        logger.error(error);
      });
  }, [checkIntegrationTokensForExpiration, setUserDetails]);

  return (
    <Flex justify="flex-start" className={classes.user}>
      {isDataLoaded ? (
        <Group>
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
