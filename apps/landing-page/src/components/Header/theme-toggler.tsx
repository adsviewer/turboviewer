import { useTheme } from 'next-themes';
import Image from 'next/image';
import { type ReactNode } from 'react';

function ThemeToggler(): ReactNode {
  const { setTheme } = useTheme();

  const switchTheme = (): void => {
    if (localStorage.getItem('theme') === 'light') {
      setTheme('dark');
    } else if (localStorage.getItem('theme') === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
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
        width={21}
        height={21}
        className={localStorage.getItem('theme') === 'dark' ? 'block' : 'hidden'}
      />
      <Image
        src="/images/icon/icon-sun.svg"
        alt="logo"
        width={22}
        height={22}
        className={localStorage.getItem('theme') === 'light' ? 'block' : 'hidden'}
      />
      <Image
        src="/images/icon/icon-auto.svg"
        alt="logo"
        width={21}
        height={22}
        className={localStorage.getItem('theme') === 'system' ? 'block' : 'hidden'}
      />
    </button>
  );
}

export default ThemeToggler;
