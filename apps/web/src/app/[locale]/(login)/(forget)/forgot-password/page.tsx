import React, { type JSX, Suspense } from 'react';
import Link from 'next/link';
import { Fallback } from '@repo/ui/fallback';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { ForgotPassword } from '@/components/login/forgot-password';

export default function Page(): JSX.Element {
  const t = useTranslations('login');
  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-center">{t('forgotPassword')}</h1>
        <Suspense fallback={<Fallback height={256} />}>
          <ForgotPassword btnText={t('resetPassword')} />
        </Suspense>
        <Link className="flex justify-center underline" href="/sign-in">
          <ArrowLeft />
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
