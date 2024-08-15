'use client';

import { Badge, Button, Card, Flex, Group, Text, useMantineTheme, Modal, Alert, Input, Tooltip } from '@mantine/core';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { type IntegrationType } from '@/graphql/generated/schema-server';
import { dateFormatOptions } from '@/util/format-utils';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { isOrgAdmin } from '@/util/access-utils';
import { deAuthIntegration } from '../actions';

interface IntegrationProps {
  title: string;
  description: string;
  authUrl?: string | null | undefined;
  integrationType: IntegrationType;
  isConnected: boolean;
  isAvailable: boolean;
  image?: ReactNode;
  adCount: number;
  lastSyncedAt: Date | null | undefined;
  accessTokenExpiresAt: Date;
}

export default function IntegrationCard(props: IntegrationProps): ReactNode {
  const t = useTranslations('integrations');
  const tGeneric = useTranslations('generic');
  const format = useFormatter();
  const [opened, { open, close }] = useDisclosure(false);
  const theme = useMantineTheme();
  const router = useRouter();
  const userDetails = useAtomValue(userDetailsAtom);
  const [isRevokeDone, setIsRevokeDone] = useState<boolean>(true);
  const [revokeFieldValue, setRevokeFieldValue] = useInputState('');

  const handleConnect = (): void => {
    if (props.authUrl) {
      window.location.href = props.authUrl;
    }
  };

  const revoke = (): void => {
    setIsRevokeDone(false);
    void deAuthIntegration(props.integrationType).then(() => {
      setIsRevokeDone(true);
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
          <Tooltip
            label={tGeneric('accessOrgAdminRoot')}
            disabled={isOrgAdmin(userDetails.allRoles) && userDetails.currentOrganization?.isRoot}
          >
            <Link href={props.authUrl ?? ''} passHref>
              <Button
                w="100%"
                mt="lg"
                component="a"
                disabled={!isOrgAdmin(userDetails.allRoles) || !userDetails.currentOrganization?.isRoot}
                onClick={() => {
                  handleConnect();
                }}
              >
                {t('connect')}
              </Button>
            </Link>
          </Tooltip>
        );
      }
      return (
        <Flex direction="column" gap="xs" mt="xs">
          <Tooltip
            label={tGeneric('accessOrgAdminRoot')}
            disabled={isOrgAdmin(userDetails.allRoles) && userDetails.currentOrganization?.isRoot}
          >
            <Link href={props.authUrl ?? ''} passHref>
              <Button
                w="100%"
                mt="lg"
                component="a"
                disabled={!isOrgAdmin(userDetails.allRoles) || !userDetails.currentOrganization?.isRoot}
                onClick={() => {
                  handleConnect();
                }}
              >
                {t('reconnect')}
              </Button>
            </Link>
          </Tooltip>
          <Tooltip
            label={tGeneric('accessOrgAdminRoot')}
            disabled={isOrgAdmin(userDetails.allRoles) && userDetails.currentOrganization?.isRoot}
          >
            <Button
              color={theme.colors.red[7]}
              onClick={open}
              disabled={!isOrgAdmin(userDetails.allRoles) || !userDetails.currentOrganization?.isRoot}
              fullWidth
            >
              {t('revoke')}
            </Button>
          </Tooltip>
        </Flex>
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

      {props.lastSyncedAt && props.isConnected ? (
        <Flex direction="column" align="flex-end" mt="md">
          <Text size="sm" c="dimmed" mb="auto" fs="italic">
            {format.number(props.adCount)} {t('ads')}
          </Text>
          <Text size="sm" c="dimmed" mb="auto" fs="italic">
            {t('syncedOn')}: {format.dateTime(new Date(String(props.lastSyncedAt)), dateFormatOptions)}
          </Text>
        </Flex>
      ) : null}

      {renderIntegrationButton()}

      {/* Revoke Modal */}
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
          <Button color="red" disabled={revokeFieldValue !== 'REVOKE' || !isRevokeDone} onClick={revoke}>
            {t('revoke')}
          </Button>
        </Flex>
      </Modal>
    </Card>
  );
}
