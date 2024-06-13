'use client';

import { Badge, Button, Card, Flex, Group, Text, useMantineTheme, Modal, Alert, Input } from '@mantine/core';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { IconAlertTriangle } from '@tabler/icons-react';
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
  const [opened, { open, close }] = useDisclosure(false);
  const theme = useMantineTheme();
  const router = useRouter();

  const [revokeFieldValue, setRevokeFieldValue] = useInputState('');

  const handleConnect = (): void => {
    if (props.authUrl) {
      window.location.href = props.authUrl;
    }
  };

  const revoke = (): void => {
    void deAuthIntegration(props.integrationType).then(() => {
      closeRevokeModal();
      router.refresh();
    });
  };

  const closeRevokeModal = (): void => {
    close();
    setRevokeFieldValue('');
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
        <Button mt="lg" color={theme.colors.red[7]} onClick={open}>
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

      <Modal opened={opened} onClose={closeRevokeModal} title={t('revoke')}>
        <Flex direction="column" gap="sm">
          <Alert variant="light" color="yellow" icon={<IconAlertTriangle />}>
            {t('revokeWarning')}
          </Alert>
          <Text ta="center">{t('revokeTip')}</Text>
          <Input
            value={revokeFieldValue}
            onChange={(event) => {
              setRevokeFieldValue(event.currentTarget.value);
            }}
          />
          <Button color="red" disabled={revokeFieldValue !== 'REVOKE'} onClick={revoke}>
            {t('revoke')}
          </Button>
        </Flex>
      </Modal>
    </Card>
  );
}
