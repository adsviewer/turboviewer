import { type JSX } from 'react';
import { useTranslations } from 'next-intl';

export default function InsightsLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTranslations('Insights');
  return (
    <div className="flex flex-col">
      <div className="flex justify-between gap-4 border-b-2 border-gray-100 p-6">
        <div className="text-4xl font-bold">{t('title')}</div>
      </div>
      <div className="px-6 py-8 mb-6">{children}</div>
    </div>
  );
}
