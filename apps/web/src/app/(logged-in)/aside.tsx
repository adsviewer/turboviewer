'use client';

import { Layers, MenuIcon, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { cx } from '@repo/ui/tailwind-utils';
import Link from 'next/link';
import { SignOutBtn } from '@/components/login/sign-out-btn';
import { LogoFull } from '@/app/(logged-in)/logo-full';
import { ActiveLink, type LinkType } from '@/components/home/active-link';

const links: LinkType[] = [
  { url: '/placements', text: 'Ad Placements', icon: <Layers /> },
  { url: '/settings/integrations', text: 'Settings', icon: <Settings /> },
];

export function Aside({ children }: { children: React.ReactNode }): React.ReactNode | null {
  const [open, setOpen] = useState(false);
  const [minimize, setMinimize] = useState(false);

  return (
    <div className={cx('bg-menu-bg text-menu-secondary', minimize ? 'lg:w-10' : 'lg:w-1/5')}>
      <div
        className={cx(
          'flex flex-col sticky top-0 z-[500] lg:h-screen lg:py-6 w-full',
          minimize ? 'lg:w-10 p-1' : 'lg:px-7 p-4',
        )}
      >
        <div className="flex lg:block items-center justify-between">
          <div
            className={cx(
              'self-baseline relative w-[98px] h-[32px] lg:w-[148px] lg:h-[48px]',
              minimize ? 'lg:hidden' : '',
            )}
          >
            <Link href="/placements" aria-label="To Home">
              <LogoFull className="stroke-menu-secondary fill-menu-secondary hover:stroke-menu-primary/90 hover:fill-menu-primary/90" />
            </Link>
          </div>
          <button
            aria-label="Toggle Menu"
            className="lg:hidden"
            type="button"
            onClick={() => {
              setOpen((o) => !o);
            }}
          >
            {open ? <X /> : <MenuIcon />}
          </button>
        </div>
        <div
          className={cx(
            'flex grow flex-col bg-menu',
            'absolute mt-16 top-0 left-0 right-0 p-4 transition-transform -translate-x-full',
            open && 'translate-x-0',
            'lg:static lg:mt-10 lg:p-0 lg:transition-none lg:translate-x-0',
          )}
        >
          <div
            className={cx('hidden lg:block mb-2 text-menu-tertiary text-md font-medium', minimize ? 'lg:hidden' : '')}
          >
            Navigate
          </div>
          <nav className="w-full grow">
            <ul className="flex flex-col gap-[21px] mb-6">
              {links.map((link) => (
                <ActiveLink key={link.url} minimized={minimize} {...link} />
              ))}
            </ul>
          </nav>
          <div>
            <div className={cx(minimize ? 'lg:hidden' : '')}>{children}</div>
            <SignOutBtn classname={minimize ? 'lg:hidden' : ''} />
          </div>
        </div>
        <button
          className="absolute right-0 bottom-0 hidden lg:block"
          type="button"
          onClick={() => {
            setMinimize((o) => !o);
          }}
        >
          {minimize ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
      </div>
    </div>
  );
}
