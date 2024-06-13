'use client';

import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SimpleGrid, Transition } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  type IntegrationsQuery,
  IntegrationStatus,
  IntegrationType,
  type SettingsChannelsQuery,
} from '@/graphql/generated/schema-server';
import metaLogo from '../../../../../public/integrations/meta-logo-icon.svg';
import tiktokLogo from '../../../../../public/integrations/tiktok-logo-icon.svg';
import linkedinLogo from '../../../../../public/integrations/linkedin-logo-icon.svg';
import IntegrationCard from './integration-card';

interface IntegrationProps {
  integrations: SettingsChannelsQuery['settingsChannels'];
  metadata: IntegrationsQuery['integrations'];
}

interface IntegrationDataType {
  adCount: number;
  lastSyncedAt: Date | null | undefined;
}

type IntegrationsDataType = {
  [key in IntegrationType]: IntegrationDataType;
};

const initialIntegrationsData: IntegrationsDataType = {
  [IntegrationType.META]: {
    adCount: 0,
    lastSyncedAt: null,
  },
  [IntegrationType.LINKEDIN]: {
    adCount: 0,
    lastSyncedAt: null,
  },
  [IntegrationType.TIKTOK]: {
    adCount: 0,
    lastSyncedAt: null,
  },
};

export default function IntegrationsGrid(props: IntegrationProps): ReactNode {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [integrationsData, setIntegrationsData] = useState<IntegrationsDataType>(initialIntegrationsData);

  const updateIntegrationsData = useCallback(() => {
    const newIntegrationsData = { ...initialIntegrationsData };
    if (props.metadata.length) {
      for (const integration of props.metadata) {
        newIntegrationsData[integration.type].lastSyncedAt = integration.lastSyncedAt;
        newIntegrationsData[integration.type].adCount = integration.adAccounts.reduce(
          (acc, adAccount) => acc + adAccount.adCount,
          0,
        );
      }
      setIntegrationsData(newIntegrationsData);
    }
  }, [props.metadata]);

  useEffect(() => {
    updateIntegrationsData();

    // Animation init
    setIsMounted(false); // Reset isMounted to false
    setTimeout(() => {
      setIsMounted(true); // Set isMounted to true after a delay to allow the transition to play
    }, 0);

    // Show error notification
    const error = searchParams.get('error');
    if (error) {
      notifications.show({
        message: error,
        color: 'red',
      });
    }
  }, [searchParams, updateIntegrationsData]);

  const isIntegrationAvailable = (status: IntegrationStatus): boolean => status !== IntegrationStatus.ComingSoon;

  const isIntegrationConnected = (status: IntegrationStatus): boolean => status === IntegrationStatus.Connected;

  return (
    <Transition mounted={isMounted} transition="fade" duration={400} timingFunction="ease">
      {(styles) => (
        <div style={styles}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            <IntegrationCard
              title="Meta"
              description="Connect your Meta account and view analytics for your ad campaigns on every Meta Platforms application!"
              authUrl={props.integrations[0].authUrl}
              integrationType={IntegrationType.META}
              isConnected={isIntegrationConnected(props.integrations[0].status)}
              isAvailable={isIntegrationAvailable(props.integrations[0].status)}
              image={<Image src={metaLogo as string} alt="Meta" width={100} priority />}
              adCount={integrationsData.META.adCount}
              lastSyncedAt={integrationsData.META.lastSyncedAt}
            />
            <IntegrationCard
              title="TikTok"
              description="Connect your TikTok account and manage all your TikTok advertisments!"
              integrationType={IntegrationType.TIKTOK}
              isConnected={isIntegrationConnected(props.integrations[1].status)}
              isAvailable={isIntegrationAvailable(props.integrations[1].status)}
              image={<Image src={tiktokLogo as string} alt="TikTok" width={100} priority />}
              adCount={integrationsData.TIKTOK.adCount}
              lastSyncedAt={integrationsData.TIKTOK.lastSyncedAt}
            />
            <IntegrationCard
              title="LinkedIn"
              description="Connect your LinkedIn account and manage all your LinkedIn advertisments!"
              authUrl={props.integrations[2].authUrl}
              integrationType={IntegrationType.LINKEDIN}
              isConnected={isIntegrationConnected(props.integrations[2].status)}
              isAvailable={isIntegrationAvailable(props.integrations[2].status)}
              image={<Image src={linkedinLogo as string} alt="LinkedIn" width={100} priority />}
              adCount={integrationsData.LINKEDIN.adCount}
              lastSyncedAt={integrationsData.LINKEDIN.lastSyncedAt}
            />
          </SimpleGrid>
        </div>
      )}
    </Transition>
  );
}
