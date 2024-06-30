'use client';

import { Select } from '@mantine/core';
import React, { useEffect, useState } from 'react';
// import { logger } from '@repo/logger';
import Cookies from 'js-cookie';
import { setCookie } from '@/app/actions';

const languages = [
  {
    label: 'English',
    value: 'en',
  },
  {
    label: 'Dutch',
    value: 'nl',
  },
  {
    label: 'Greek',
    value: 'el',
  },
];

export default function LanguagePicker(): React.ReactElement {
  const [language, setLanguage] = useState<string>('en');

  useEffect(() => {
    const currLanguage: string = Cookies.get('NEXT_LOCALE') ?? 'en';
    setLanguage(currLanguage);
  }, []);

  const handleLanguageChange = (value: string | null): void => {
    if (value) {
      setLanguage(value);
      void setCookie('NEXT_LOCALE', value);
    }
  };

  return (
    <Select
      placeholder="Select language"
      data={languages}
      onChange={handleLanguageChange}
      comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
      value={language}
      my={4}
    />
  );
}
