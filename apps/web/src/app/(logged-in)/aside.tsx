'use client';

import { Layers, MenuIcon, Settings, X } from 'lucide-react';
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

  return (
    <aside className="bg-menu-bg text-menu-secondary">
      <div className="flex flex-col sticky top-0 z-[500] lg:fixed lg:top-auto lg:z-auto lg:h-screen p-4 lg:px-7 lg:py-6 w-full lg:w-[280px]">
        <div className="flex lg:block items-center justify-between">
          <div className="self-baseline relative w-[98px] h-[32px] lg:w-[148px] lg:h-[48px]">
            <Link href="/placements">
              <LogoFull className="stroke-menu-secondary fill-menu-secondary hover:stroke-menu-primary/90 hover:fill-menu-primary/90" />
            </Link>
          </div>
          <button
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
          <div className="hidden lg:block mb-2 text-menu-tertiary text-md font-medium">Navigate</div>
          <nav className="w-full grow">
            <ul className="flex flex-col gap-[21px]">
              {links.map((link) => (
                <ActiveLink key={link.url} {...link} />
              ))}
            </ul>
          </nav>
          <div>
            <div>{children}</div>
            <SignOutBtn />
          </div>
        </div>
      </div>
    </aside>
  );
}
