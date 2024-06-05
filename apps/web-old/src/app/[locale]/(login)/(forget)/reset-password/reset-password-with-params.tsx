'use client';

import React, { Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { ResetPassword } from '@/components/login/reset-password';

interface ResetPasswordBtnProps {
  token: string;
  changePassword: string;
}

export default function ResetPasswordWithParams({
  token,
  changePassword,
}: ResetPasswordBtnProps): React.ReactElement | null {
  return (
    <>
      <h1 className="text-2xl text-center">{changePassword}</h1>
      <Suspense fallback={<Fallback height={256} />}>
        <ResetPassword btnText={changePassword} token={token} />
      </Suspense>
    </>
  );
}
