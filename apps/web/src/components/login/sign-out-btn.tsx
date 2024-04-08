'use client';

import { LogOut } from 'lucide-react';
import { type JSX } from 'react';
import { cx } from '@repo/ui/tailwind-utils';
import { signOut } from '@/app/(login)/(normal)/actions';

export function SignOutBtn({ classname }: { classname?: string }): JSX.Element {
  const handleLogout = (): void => {
    signOut();
  };
  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        className={cx(
          'mt-10 lg:mt-[21px] flex items-center gap-2 text-md font-semibold text-menu-tertiary hover:text-primary/90 transition-all',
          classname,
        )}
      >
        <LogOut className="text-menu-tertiary" />
        Sign Out
      </button>
    </div>
  );
}
