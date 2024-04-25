import { useTranslations } from 'next-intl';
import React from 'react';
import PageSizeSelect from '@/components/filters/page-size-select';

export function PageSize({ pageSize }: { pageSize: number }): React.ReactElement {
  const t = useTranslations('Filters');
  return (
    <PageSizeSelect pageSize={pageSize} pageSizeLabel={t('pageSize')}>
      {[6, 12, 18, 50, 100].map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </PageSizeSelect>
  );
}
