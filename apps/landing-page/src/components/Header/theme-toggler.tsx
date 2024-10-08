'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { type ReactNode } from 'react';

function ThemeToggler(): ReactNode {
  const { theme, setTheme } = useTheme();

  const switchTheme = (): void => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      type="button"
      aria-label="theme toggler"
      onClick={() => {
        switchTheme();
      }}
      className="bg-gray-2 dark:bg-dark-bg absolute right-17 mr-1.5 flex cursor-pointer items-center justify-center rounded-full text-black dark:text-white lg:static"
    >
      <Image
        src="/images/icon/icon-moon.svg"
        alt="logo"
        width={22}
        height={22}
        className={theme === 'light' ? 'block' : 'hidden'}
      />
      <Image
        src="/images/icon/icon-sun.svg"
        alt="logo"
        width={22}
        height={22}
        className={theme === 'system' ? 'block' : 'hidden'}
      />
      <Image
        src="/images/icon/icon-auto.svg"
        alt="logo"
        width={22}
        height={22}
        className={theme === 'dark' ? 'block' : 'hidden'}
      />
    </button>
  );
}

export default ThemeToggler;
