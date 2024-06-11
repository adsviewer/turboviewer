import { Select } from '@mantine/core';
import React, { useEffect } from 'react';
import { getCookie, setCookie } from '@/app/actions';

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

export default function LanguagePicker(): React.ReactNode {
  // const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    void getCookie('NEXT_LOCALE').then(() => {
      // setLocale(cookieData?.value ?? 'en');
    });
  }, []);

  const handleLanguageChange = (value: string | null): void => {
    void setCookie('NEXT_LOCALE', String(value)).then(() => {
      // setLocale(value ?? 'en');
    });
  };

  return (
    <Select
      placeholder="Select language"
      data={languages}
      onChange={handleLanguageChange}
      comboboxProps={{ transitionProps: { transition: 'fade-down', duration: 200 } }}
      my={4}
    />
  );
}
