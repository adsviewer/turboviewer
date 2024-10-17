/* eslint-disable jsx-a11y/media-has-caption -- no captions needed for now  */
'use client';

import Link from 'next/link';
import { Button, Card, Flex, Group, Text } from '@mantine/core';
import { IconBuilding, IconPlugConnected } from '@tabler/icons-react';
import React from 'react';

interface PropsType {
  videoSrc: string;
  title: string;
  description: string;
}

export default function VideoCard(props: PropsType): React.ReactNode {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <video width="100%" controls>
          <source src={props.videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{props.title}</Text>
      </Group>

      <Text size="sm" c="dimmed">
        {props.description}
      </Text>

      <Flex gap="sm">
        <Button
          component={Link}
          href="/integrations"
          target="_blank"
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
          target="_blank"
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
