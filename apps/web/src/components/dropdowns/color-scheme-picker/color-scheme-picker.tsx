import { Select, useMantineColorScheme, useComputedColorScheme, type MantineColorScheme } from '@mantine/core';
import React, { useState } from 'react';

const colorSchemes = [
  {
    label: 'Light',
    value: 'light',
  },
  {
    label: 'Dark',
    value: 'dark',
  },
  {
    label: 'Auto',
    value: 'auto',
  },
];

export default function ColorSchemePicker(): React.ReactNode {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const [scheme, setScheme] = useState<MantineColorScheme>(computedColorScheme);

  const handleColorSchemeChange = (value: string | null): void => {
    if (value) {
      setColorScheme(value as MantineColorScheme);
      setScheme(value as MantineColorScheme);
    }
  };

  return (
    <Select
      placeholder="Select color scheme"
      data={colorSchemes}
      value={scheme}
      comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
      onChange={handleColorSchemeChange}
      my={4}
    />
  );
}
