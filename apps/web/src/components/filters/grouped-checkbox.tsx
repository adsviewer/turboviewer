'use client';

import { type ChangeEvent, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Checkbox from '@repo/ui/checkbox';
import { type SearchParamsKeys, useCreateGroupedByString } from '@/app/[locale]/(logged-in)/insights/query-string-util';

export default function GroupedCheckbox<T extends string>({
  label,
  id,
  groupByColumn,
  groupKey,
}: {
  label: string;
  id: string;
  groupByColumn: T;
  groupKey: SearchParamsKeys;
}): React.ReactElement {
  const [isTransitioning, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCreateGroupedByString(searchParams, groupKey);
  const checked = searchParams.getAll(groupKey).includes(groupByColumn);

  function onChange(event: ChangeEvent<HTMLInputElement>): void {
    startTransition(() => {
      router.replace(`${pathname}/?${createQueryString(groupByColumn, event.target.checked)}`);
    });
  }

  return (
    <div>
      <label
        className="flex whitespace-nowrap cursor-pointer px-2 py-1 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900 [&:has(input:checked)]:bg-blue-200 dark:[&:has(input:checked)]:bg-blue-800"
        htmlFor={id}
      >
        <Checkbox id={id} className="m-1" defaultChecked={checked} onChange={onChange} disabled={isTransitioning} />
        {label}
      </label>
    </div>
  );
}

export function GroupedByCheckbox<T extends string>({
  label,
  id,
  groupByColumn,
}: {
  label: string;
  id: string;
  groupByColumn: T;
}): React.ReactElement {
  return GroupedCheckbox({ label, id, groupByColumn, groupKey: 'groupedBy' });
}
