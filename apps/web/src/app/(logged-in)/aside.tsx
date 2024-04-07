'use client';

import { MenuIcon, X } from 'lucide-react';
import { useState } from 'react';
import { cx } from '@repo/ui/tailwind-utils';
import { SignOutBtn } from '@/components/login/sign-out-btn';
import { LogoFull } from '@/app/(logged-in)/logo-full';

export function Aside({ children }: { children: React.ReactNode }): React.ReactNode | null {
  const [open, setOpen] = useState(false);

  return (
    <aside className="bg-purple-500">
      <div className="flex flex-col sticky top-0 z-[500] lg:fixed lg:top-auto lg:z-auto lg:h-screen p-4 lg:px-7 lg:py-6 w-full lg:w-[280px]">
        <div className="flex lg:block items-center justify-between">
          <div className="self-baseline relative w-[98px] h-[32px] lg:w-[148px] lg:h-[48px]">
            <LogoFull className="stroke-gray-100 fill-gray-100" />
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
            'flex grow flex-col bg-purple-500',
            'absolute mt-16 top-0 left-0 right-0 p-4 transition-transform -translate-x-full',
            open && 'translate-x-0',
            'lg:static lg:mt-10 lg:p-0 lg:transition-none lg:translate-x-0',
          )}
        >
          {/*<div className="hidden lg:block mb-2 text-gray-400 text-md font-medium">Navigate</div>*/}
          <nav className="w-full grow" />
          <div>
            <div>{children}</div>
            <SignOutBtn />
          </div>
        </div>
      </div>
    </aside>
  );
}
