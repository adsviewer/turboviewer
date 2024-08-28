'use client';

import { useEffect } from 'react';
import { setCookie } from '@/app/actions';

export default function UserLocaleSetter(): React.ReactNode {
  useEffect(() => {
    Cookies.set('USER_LOCALE', navigator.language);
  }, []);

  // eslint-disable-next-line react/jsx-no-useless-fragment -- just an empty react node
  return <></>;
}
