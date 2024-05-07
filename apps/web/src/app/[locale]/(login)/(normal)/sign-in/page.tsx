import React, { type JSX, Suspense } from 'react';
import Link from 'next/link';
import { Fallback } from '@repo/ui/fallback';
import { useTranslations } from 'next-intl';
import { SignIn } from '@/components/login/sign-in';

export default function Page(): JSX.Element {
  const t = useTranslations('login');
  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-center">{t('signIn')}</h1>
        <Suspense fallback={<Fallback height={256} />}>
          <SignIn title={t('signIn')} />
        </Suspense>
        <Link className="text-center underline" href="/sign-up">
          No account yet? Create one.
        </Link>
      </div>
    </div>
  );
}
