'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { cx } from '@repo/ui/tailwind-utils';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { env } from '@/env.mjs';
import menuData from './menu-data';

// Lazy load theme toggler
const ThemeToggler = dynamic(() => import('./theme-toggler'), { ssr: false });

function Header(): ReactNode {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const t = useTranslations('header');

  const pathUrl = usePathname();

  // Sticky menu
  const handleStickyMenu = (): void => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleStickyMenu);
  });

  return (
    <header
      className={`fixed left-0 top-0 z-99999 w-full py-7 ${
        stickyMenu ? 'bg-white !py-4 shadow transition duration-100 dark:bg-black' : ''
      }`}
    >
      <div className="relative mx-auto max-w-c-1390 items-center justify-between px-4 md:px-8 xl:flex 2xl:px-0">
        <div className="flex w-full items-center justify-between xl:w-1/4">
          <a href="/">
            <Image
              src="/images/logo/logo-dark.svg"
              alt="logo"
              width={0}
              height={0}
              style={{ width: 'auto', height: 'auto' }}
              className="hidden w-full dark:block"
            />
            <Image
              src="/images/logo/logo-light.svg"
              priority
              alt="logo"
              width={0}
              height={0}
              style={{ width: 'auto', height: 'auto' }}
              className="w-full dark:hidden"
            />
          </a>

          {/* <!-- Hamburger Toggle BTN --> */}
          <button
            type="button"
            aria-label="hamburger Toggler"
            className="block xl:hidden"
            onClick={() => {
              setNavigationOpen(!navigationOpen);
            }}
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="absolute right-0 block h-full w-full">
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                    !navigationOpen ? '!w-full delay-300' : 'w-0'
                  }`}
                />
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                    !navigationOpen ? 'delay-400 !w-full' : 'w-0'
                  }`}
                />
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                    !navigationOpen ? '!w-full delay-500' : 'w-0'
                  }`}
                />
              </span>
              <span className="du-block absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                    !navigationOpen ? '!h-0 delay-[0]' : 'h-full'
                  }`}
                />
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
                    !navigationOpen ? '!h-0 delay-200' : 'h-0.5'
                  }`}
                />
              </span>
            </span>
          </button>
          {/* <!-- Hamburger Toggle BTN --> */}
        </div>

        {/* Nav Menu Start   */}
        <div
          className={cx(
            'invisible h-0 w-full items-center justify-between xl:visible xl:flex xl:h-auto xl:w-full',
            navigationOpen
              ? 'navbar !visible mt-4 h-auto max-h-[400px] rounded-md bg-white p-7.5 shadow-solid-5 dark:bg-blacksection xl:h-auto xl:p-0 xl:shadow-none xl:dark:bg-transparent'
              : '',
          )}
        >
          <nav>
            <ul className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-10">
              {menuData.map((menuItem) => (
                <li key={menuItem.id} className={menuItem.submenu ? 'group relative' : undefined}>
                  {menuItem.submenu ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownToggler(!dropdownToggler);
                        }}
                        className="flex cursor-pointer items-center justify-between gap-3 hover:text-primary"
                      >
                        {t(menuItem.title)}
                        <span>
                          <svg
                            className="h-3 w-3 cursor-pointer fill-waterloo group-hover:fill-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                          >
                            <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                          </svg>
                        </span>
                      </button>

                      <ul className={`dropdown ${dropdownToggler ? 'flex' : ''}`}>
                        {menuItem.submenu.map((item) => (
                          <li key={item.id} className="hover:text-primary">
                            <Link href={item.path ?? '#'} scroll>
                              {t(item.title)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link
                      href={String(menuItem.path)}
                      className={pathUrl === menuItem.path ? 'text-primary hover:text-primary' : 'hover:text-primary'}
                      scroll
                    >
                      {t(menuItem.title)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-7 flex items-center gap-6 xl:mt-0">
            <ThemeToggler />
            <Link
              href={`${env.NEXT_PUBLIC_WEBAPP_ENDPOINT}/sign-up`}
              className="flex items-center justify-center rounded-full bg-primary px-7.5 py-2.5 text-regular text-white duration-300 ease-in-out hover:bg-primaryho"
            >
              {t('getPro')}
            </Link>
            <Link
              href={`${env.NEXT_PUBLIC_WEBAPP_ENDPOINT}/sign-in`}
              className="flex items-center justify-center rounded-full bg-gray-700 px-7.5 py-2.5 text-regular text-white duration-300 ease-in-out hover:bg-gray-500"
            >
              {t('Sign In')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// w-full delay-300

export default Header;
