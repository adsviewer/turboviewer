import React, { type JSX } from 'react';
import { useTranslations } from 'next-intl';
import ResetPasswordNoParams from '@/app/[locale]/(login)/(forget)/reset-password/reset-password-no-params';

export default function Page(): JSX.Element {
  const t = useTranslations('login');
  return (
    <div>
      <div className="text-destructive" />
      <div className="flex flex-col gap-6">
        <ResetPasswordNoParams
          forgotPassword={t('forgotPassword')}
          tokenMissing={t('tokenMissing')}
          tokenExpired={t('tokenExpired')}
          tokenMissingMsg={t('tokenMissingMsg')}
          tokenExpiredMsg={t('tokenExpiredMsg')}
          changePassword={t('changePassword')}
        />
      </div>
    </div>
  );
}
