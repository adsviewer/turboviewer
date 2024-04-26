'use client';

import { type ChangeEvent, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Checkbox from '@repo/ui/checkbox';
import { useCreateGroupedByString } from '@/app/[locale]/(logged-in)/insights/query-string-util';
import { type InsightsColumnsGroupBy } from '@/graphql/generated/schema-server';

export default function GroupedCheckbox({
  label,
  id,
  groupByColumn,
}: {
  label: string;
  id: string;
  groupByColumn: InsightsColumnsGroupBy;
}): React.ReactElement {
  const [isTransitioning, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCreateGroupedByString(searchParams);
  const checked = searchParams.getAll('groupedBy').includes(groupByColumn);

  function onChange(event: ChangeEvent<HTMLInputElement>): void {
    startTransition(() => {
      router.replace(`${pathname}/?${createQueryString(groupByColumn, event.target.checked)}`);
    });
  }

  return (
    <div>
      <label htmlFor={id}>{label}:</label>
      <Checkbox id={id} className="m-1" defaultChecked={checked} onChange={onChange} disabled={isTransitioning} />
    </div>
  );
}
