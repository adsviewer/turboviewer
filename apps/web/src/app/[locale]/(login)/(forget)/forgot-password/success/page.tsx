import React, { type JSX, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import ResetEmail from '@/app/[locale]/(login)/(forget)/forgot-password/success/reset-email';
import ResetEmailBtn from '@/app/[locale]/(login)/(forget)/forgot-password/success/reset-email-btn';

export default function Page(): JSX.Element {
  const t = useTranslations('login');
  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-center">{t('checkYourEmail')}</h1>
        <div>
          <div className="flex justify-center">{t('forgotPasswordInstructions')}</div>
          <Suspense>
            <ResetEmail />
          </Suspense>
        </div>
        <Suspense>
          <ResetEmailBtn resendCode={t('resendCode')} />
        </Suspense>
      </div>
    </div>
  );
}
