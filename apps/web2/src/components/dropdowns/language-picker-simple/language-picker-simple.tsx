import { Select } from '@mantine/core';
import React, { useState } from 'react';
import { getCookie, setCookie } from '@/app/actions';

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
  const [locale, setLocale] = useState<string>('en');

  void getCookie('NEXT_LOCALE').then((cookieData) => {
    setLocale(cookieData?.value ?? 'en');
  });

  const handleLanguageChange = (value: string | null): void => {
    void setCookie('NEXT_LOCALE', String(value)).then(() => {
      setLocale(value ?? 'en');
    });
  };

  return (
    <Select
      placeholder="Select language"
      data={languages}
      value={locale}
      comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
      onChange={handleLanguageChange}
      my={4}
    />
  );
}
