'use client';

import { type JSX } from 'react';
import { signOut } from '@/app/(login)/(normal)/actions';

export function SignOutBtn(): JSX.Element {
  const handleLogout = (): void => {
    signOut();
  };
  return (
    <button type="button" onClick={handleLogout}>
      Sign Out
    </button>
  );
}
