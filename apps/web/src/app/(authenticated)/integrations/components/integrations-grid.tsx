'use client';

import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SimpleGrid } from '@mantine/core';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { tierConstraints } from '@repo/mappings';
import { useAtomValue } from 'jotai';
import {
  type IntegrationsQuery,
  IntegrationStatus,
  IntegrationType,
  type SettingsChannelsQuery,
} from '@/graphql/generated/schema-server';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import metaLogo from '../../../../../public/integrations/meta-logo-icon.svg';
import tiktokLogo from '../../../../../public/integrations/tiktok-logo-icon.svg';
import linkedinLogo from '../../../../../public/integrations/linkedin-logo-icon.svg';
import googleLogo from '../../../../../public/integrations/google-logo-icon.svg';
import snapchatLogo from '../../../../../public/integrations/snapchat-logo-icon.svg';
import redditLogo from '../../../../../public/integrations/reddit-logo-icon.svg';
import IntegrationCard from './integration-card';
import Graphics from './graphics';

interface IntegrationProps {
  integrations: SettingsChannelsQuery['settingsChannels'];
  metadata: IntegrationsQuery['integrations'];
}

interface IntegrationDataType {
  adCount: number;
  lastSyncedAt: Date | null | undefined;
  status: IntegrationStatus;
}

type IntegrationsDataType = {
  [key in IntegrationType]: IntegrationDataType;
};

const initialIntegrationsData: IntegrationsDataType = {
  [IntegrationType.META]: {
    adCount: 0,
    lastSyncedAt: null,
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationType.LINKEDIN]: {
    adCount: 0,
    lastSyncedAt: null,
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationType.TIKTOK]: {
    adCount: 0,
    lastSyncedAt: null,
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationType.GOOGLE]: {
    adCount: 0,
    lastSyncedAt: null,
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationType.REDDIT]: {
    adCount: 0,
    lastSyncedAt: null,
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationType.SNAPCHAT]: {
    adCount: 0,
    lastSyncedAt: null,
    status: IntegrationStatus.ComingSoon,
  },
};

export default function IntegrationsGrid(props: IntegrationProps): ReactNode {
  const searchParams = useSearchParams();
  const [integrationsData, setIntegrationsData] = useState<IntegrationsDataType>(initialIntegrationsData);
  const userDetails = useAtomValue(userDetailsAtom);

  const updateIntegrationsData = useCallback(() => {
    const newIntegrationsData = { ...initialIntegrationsData };
    if (props.metadata.length) {
      for (const integration of props.metadata) {
        newIntegrationsData[integration.type].lastSyncedAt = integration.lastSyncedAt;
        newIntegrationsData[integration.type].adCount = integration.adAccounts.reduce(
          (acc, adAccount) => acc + adAccount.adCount,
          0,
        );
        newIntegrationsData[integration.type].status = integration.status;
      }
      setIntegrationsData(newIntegrationsData);
    }
  }, [props.metadata]);

  const allowNewConnectionBasedOnTier = (): boolean => {
    if (userDetails.currentOrganization?.tier) {
      if (
        userDetails.currentOrganization.integrations.filter((i) => i.status === IntegrationStatus.Connected).length >=
        tierConstraints[userDetails.currentOrganization.tier].maxIntegrations
      )
        return false;
    }
    return true;
  };

  useEffect(() => {
    updateIntegrationsData();
  }, [searchParams, updateIntegrationsData]);

  const isIntegrationErrored = (status: IntegrationStatus): boolean => status === IntegrationStatus.Errored;

  const isIntegrationAvailable = (status: IntegrationStatus): boolean => status !== IntegrationStatus.ComingSoon;

  const isIntegrationConnected = (status: IntegrationStatus): boolean =>
    status === IntegrationStatus.Connected ||
    status === IntegrationStatus.Expiring ||
    status === IntegrationStatus.Errored;

  const map = new Map<IntegrationType, { title: string; description?: string; imageSrc: string }>([
    [
      IntegrationType.META,
      {
        title: 'Meta',
        description:
          'Connect your Meta account and view analytics for your ad campaigns on every Meta Platforms application!',
        imageSrc: metaLogo as string,
      },
    ],
    [IntegrationType.TIKTOK, { title: 'TikTok', imageSrc: tiktokLogo as string }],
    [IntegrationType.LINKEDIN, { title: 'LinkedIn', imageSrc: linkedinLogo as string }],
    [IntegrationType.GOOGLE, { title: 'Google', imageSrc: googleLogo as string }],
    [IntegrationType.SNAPCHAT, { title: 'Snapchat', imageSrc: snapchatLogo as string }],
    [IntegrationType.REDDIT, { title: 'Reddit', imageSrc: redditLogo as string }],
  ]);

  return (
    <>
      <Graphics />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {props.integrations.map((integration) => {
          const info = map.get(integration.type);
          if (!info) return null;
          const { title, description, imageSrc } = info;
          return (
            <IntegrationCard
              key={integration.type}
              title={title}
              description={description ?? `Connect your ${title} account and manage all your ${title} advertisments!`}
              authUrl={integration.authUrl}
              integrationType={integration.type}
              isConnected={isIntegrationConnected(integration.status)}
              isAvailable={isIntegrationAvailable(integration.status)}
              isErrored={isIntegrationErrored(integration.status)}
              allowNewConnection={allowNewConnectionBasedOnTier()}
              image={<Image src={imageSrc} alt={title} width={100} priority />}
              adCount={integrationsData[integration.type].adCount}
              lastSyncedAt={integrationsData[integration.type].lastSyncedAt}
              status={integrationsData[integration.type].status}
            />
          );
        })}
      </SimpleGrid>
    </>
  );
}
