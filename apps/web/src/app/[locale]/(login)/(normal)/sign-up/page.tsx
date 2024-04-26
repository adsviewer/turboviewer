import React, { type JSX, Suspense } from 'react';
import Link from 'next/link';
import { Fallback } from '@repo/ui/fallback';
import { useTranslations } from 'next-intl';
import { SignUp } from '@/components/login/sign-up';

export default function Page(): JSX.Element {
  const t = useTranslations('login');
  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-center">{t('signUp')}</h1>
        <Suspense fallback={<Fallback height={364} />}>
          <SignUp title={t('signUp')} />
        </Suspense>
        <Link className="text-center underline" href="/sign-in">
          Already have an account? Log in.
        </Link>
      </div>
    </div>
  );
}
