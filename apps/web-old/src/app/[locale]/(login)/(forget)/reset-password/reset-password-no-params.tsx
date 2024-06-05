'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import ResetPasswordWithParams from './reset-password-with-params';

interface ResetPasswordNoParamsProps {
  changePassword: string;
  forgotPassword: string;
  tokenMissing: string;
  tokenExpired: string;
  tokenMissingMsg: string;
  tokenExpiredMsg: string;
}

export default function ResetPasswordNoParams({
  changePassword,
  forgotPassword,
  tokenExpiredMsg,
  tokenMissingMsg,
  tokenMissing,
  tokenExpired,
}: ResetPasswordNoParamsProps): React.ReactElement | null {
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const expires = searchParams.get('expires');

  if (!token || !expires || parseInt(expires) < Date.now()) {
    const title = !token ? tokenMissing : tokenExpired;
    const reason = !token ? tokenMissingMsg : tokenExpiredMsg;
    return (
      <>
        <h1 className="text-2xl text-center">{title}</h1>
        <div className="flex justify-center">{reason}</div>
        <Link className="flex justify-center underline" href="/forgot-password">
          <ArrowLeft />
          {forgotPassword}
        </Link>
      </>
    );
  }
  return <ResetPasswordWithParams token={token} changePassword={changePassword} />;
}
