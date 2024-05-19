import { ActionIcon, useMantineColorScheme, useComputedColorScheme, Group } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { type ReactNode } from 'react';

export default function ColorSchemeToggle(): ReactNode {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <Group justify="center">
      <ActionIcon
        onClick={() => {
          setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light');
        }}
        variant="default"
        size="xl"
        aria-label="Toggle color scheme"
      >
        {computedColorScheme === 'light' ? <IconMoon /> : <IconSun />}
      </ActionIcon>
    </Group>
  );
}
