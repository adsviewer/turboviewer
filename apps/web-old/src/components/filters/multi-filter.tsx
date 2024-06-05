import { useTranslations } from 'next-intl';
import React from 'react';
import type { SearchParamsKeys } from '@/app/[locale]/(logged-in)/insights/query-string-util';
import GroupedCheckbox from '@/components/filters/grouped-checkbox';
import MultiSelectDropdown from '@/components/filters/multi-select-dropdown';

interface MultiFilterProps {
  options: { value: string; label: string }[] | string[];
  groupKey: SearchParamsKeys;
  prompt?: string;
}

export default function MultiFilter({ options, groupKey }: MultiFilterProps): React.ReactElement {
  const t = useTranslations('filters');

  if (options.length <= 3) {
    return (
      <div>
        <div>{t(groupKey)}</div>
        {options.map((option) => (
          <GroupedCheckbox
            key={typeof option === 'string' ? option : option.value}
            label={typeof option === 'string' ? option : option.label}
            id={`filter.${groupKey}`}
            groupByColumn={typeof option === 'string' ? option : option.value}
            groupKey={groupKey}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="py-0.5">
      <MultiSelectDropdown options={options} groupKey={groupKey} prompt={`${t('select')} ${t(groupKey)}...`} />
    </div>
  );
}
