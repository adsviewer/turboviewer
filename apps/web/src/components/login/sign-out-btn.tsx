'use client';

import { LogOut } from 'lucide-react';
import { type JSX } from 'react';
import { signOut } from '@/app/(login)/(normal)/actions';

export function SignOutBtn(): JSX.Element {
  const handleLogout = (): void => {
    signOut();
  };
  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-10 lg:mt-[21px] flex items-center gap-2 text-md font-semibold text-menu-tertiary hover:text-primary/90 transition-all"
      >
        <LogOut className="text-menu-tertiary" />
        Sign Out
      </button>
    </div>
  );
}
