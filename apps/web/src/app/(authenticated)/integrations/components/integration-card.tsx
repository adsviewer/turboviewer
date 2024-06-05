'use client';

import { Badge, Button, Card, Flex, Group, Text, useMantineTheme } from '@mantine/core';
import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type IntegrationType } from '@/graphql/generated/schema-server';
import { deAuthIntegration } from '../actions';

interface IntegrationProps {
  title: string;
  description: string;
  authUrl?: string | null | undefined;
  integrationType: IntegrationType;
  isConnected: boolean;
  isAvailable: boolean;
  image?: ReactNode;
}

export default function IntegrationCard(props: IntegrationProps): ReactNode {
  const t = useTranslations('integrations');
  const theme = useMantineTheme();
  const router = useRouter();

  const handleRevoke = (): void => {
    void deAuthIntegration(props.integrationType).then(() => {
      router.refresh();
    });
  };

  const handleConnect = (): void => {
    if (props.authUrl) {
      window.location.href = props.authUrl;
    }
  };

  const renderIntegrationButton = (): ReactNode => {
    if (props.isAvailable) {
      if (!props.isConnected) {
        return (
          <Button
            mt="lg"
            onClick={() => {
              handleConnect();
            }}
          >
            {t('connect')}
          </Button>
        );
      }
      return (
        <Button
          mt="lg"
          color={theme.colors.red[7]}
          onClick={() => {
            handleRevoke();
          }}
        >
          {t('revoke')}
        </Button>
      );
    }
    return (
      <Button mt="lg" disabled>
        {t('comingSoon')}!
      </Button>
    );
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Flex justify="center" align="center" p="xl">
          {props.image ? props.image : null}
        </Flex>
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{props.title}</Text>
        {props.isConnected ? (
          <Badge color="green">{t('connected')}</Badge>
        ) : (
          <Badge color="gray">{t('notConnected')}</Badge>
        )}
      </Group>

      <Text size="sm" c="dimmed" mb="auto">
        {props.description}
      </Text>

      {renderIntegrationButton()}
    </Card>
  );
}
