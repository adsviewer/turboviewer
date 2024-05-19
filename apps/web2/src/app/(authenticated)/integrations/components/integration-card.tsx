'use client';

import { Badge, Button, Card, Group, Image, Text, useMantineTheme } from '@mantine/core';
import { type ReactNode } from 'react';

interface IntegrationProps {
  title: string;
  description: string;
  isConnected: boolean;
}

export default function IntegrationCard(props: IntegrationProps): ReactNode {
  const theme = useMantineTheme();
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-6.png" height={300} />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{props.title}</Text>
        {props.isConnected ? <Badge color="green">Connected</Badge> : null}
      </Group>

      <Text size="sm" c="dimmed">
        {props.description}
      </Text>

      {!props.isConnected ? (
        <Button mt="lg">Connect</Button>
      ) : (
        <Button mt="lg" color={theme.colors.red[7]}>
          Revoke
        </Button>
      )}
    </Card>
  );
}
