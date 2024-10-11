'use client';

import Link from 'next/link';
import { Button, Card, Flex, Group, Image, Text } from '@mantine/core';
import { IconBuilding, IconPlugConnected } from '@tabler/icons-react';
import React from 'react';

export default function VideoCard(): React.ReactNode {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"
          height={350}
          alt="Norway"
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>Welcome to AdsViewer!</Text>
      </Group>

      <Text size="sm" c="dimmed">
        In order to use AdsViewer you need to set up your integrations and set up your organization.
      </Text>

      <Flex gap="sm">
        <Button
          component={Link}
          href="/integrations"
          leftSection={<IconPlugConnected />}
          variant="gradient"
          fullWidth
          mt="md"
          radius="md"
        >
          Go to Integrations
        </Button>
        <Button
          component={Link}
          href="/organization"
          leftSection={<IconBuilding />}
          variant="gradient"
          fullWidth
          mt="md"
          radius="md"
        >
          Go to Organization
        </Button>
      </Flex>
    </Card>
  );
}
