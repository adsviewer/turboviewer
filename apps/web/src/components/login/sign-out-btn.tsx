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
        className="mt-10 lg:mt-[21px] flex items-center gap-2 text-md font-semibold text-gray-300 hover:text-primary-600 transition-all"
      >
        <LogOut className="text-gray-300" />
        Sign Out
      </button>
    </div>
  );
}
