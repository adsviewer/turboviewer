import { useTranslations } from 'next-intl';
import React from 'react';
import SearchParamsSelect from '@/components/filters/search-params-select';

export function PageSize({ pageSize }: { pageSize: number }): React.ReactElement {
  const t = useTranslations('filters');
  return (
    <SearchParamsSelect defaultValue={pageSize} label={t('pageSize')} searchParamKey="pageSize">
      {[6, 12, 18, 50, 100].map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </SearchParamsSelect>
  );
}
