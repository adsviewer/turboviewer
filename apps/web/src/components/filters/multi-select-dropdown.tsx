import React from 'react';
import * as changeCase from 'change-case';
import GroupedCheckbox from '@/components/filters/grouped-checkbox';
import type { SearchParamsKeys } from '@/app/[locale]/(logged-in)/insights/query-string-util';

interface MultiSelectDropdownProps {
  options: { value: string; label: string }[] | string[];
  groupKey: SearchParamsKeys;
  prompt?: string;
}

export default function MultiSelectDropdown({
  options,
  groupKey,
  prompt,
}: MultiSelectDropdownProps): React.ReactElement {
  return (
    <label className="relative">
      <input type="checkbox" className="hidden peer" />

      <div className="cursor-pointer after:content-['▼'] after:text-xs after:ml-1 after:inline-flex after:items-center peer-checked:after:-rotate-180 after:transition-transform inline-flex border border-gray-400 rounded px-5 py-2 has-[+*_:checked]:outline outline-2 outline-blue-200 dark:outline-blue-800">
        {changeCase.noCase(prompt ?? '')}
      </div>

      <div className="z-10 absolute bg-gray-200 dark:bg-gray-700 border transition-opacity opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto w-max max-h-60 overflow-y-scroll">
        <ul>
          {options.map((option, _i) => {
            return (
              <li key={typeof option === 'string' ? option : option.value}>
                <GroupedCheckbox
                  label={typeof option === 'string' ? option : option.label}
                  id={`${groupKey}-${typeof option === 'string' ? option : option.value}`}
                  groupByColumn={typeof option === 'string' ? option : option.value}
                  groupKey={groupKey}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </label>
  );
}
