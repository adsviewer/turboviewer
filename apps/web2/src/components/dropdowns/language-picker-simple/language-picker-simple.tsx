import { Select } from '@mantine/core';
import React from 'react';

const languages = [
  {
    label: 'English',
    value: 'en',
  },
  {
    label: 'Greek',
    value: 'el',
  },
];

export default function LanguagePickerSimple(): React.ReactNode {
  // const currLanguage = getCookie('NEXT_LOCALE').value ?? 'en';
  const currLanguage = 'en';

  const handleLanguageChange = (value: string | null): void => {
    // eslint-disable-next-line no-console -- t
    console.log(value);
  };

  return (
    <Select
      placeholder="Select color scheme"
      data={languages}
      value={currLanguage}
      comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
      onChange={handleLanguageChange}
      my={4}
    />
  );
}
