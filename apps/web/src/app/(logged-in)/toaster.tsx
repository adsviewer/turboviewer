'use client';

import { useSearchParams } from 'next/navigation';
import { type JSX, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Toaster(): JSX.Element {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorMsg = searchParams.get('error')?.replace('_', ' ');
    if (errorMsg) {
      toast(errorMsg, { type: 'error' });
    }
  }, [searchParams]);

  return <ToastContainer autoClose={10000} position="bottom-right" />;
}
