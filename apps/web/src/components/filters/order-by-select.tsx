'use client';

import { type ChangeEvent, useTransition } from 'react';
import Select from '@repo/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type InsightsColumnsOrderBy } from '@/graphql/generated/schema-server';
import { useCreateQueryString } from '@/app/[locale]/(logged-in)/insights/query-string-util';

export default function OrderBySelect({
  orderBy,
  children,
  orderByLabel,
}: {
  orderBy: InsightsColumnsOrderBy;
  orderByLabel: string;
  children: React.ReactNode;
}): React.ReactElement {
  const [isTransitioning, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCreateQueryString(searchParams);

  function onChange(event: ChangeEvent<HTMLSelectElement>): void {
    startTransition(() => {
      router.replace(`${pathname}/?${createQueryString('orderBy', event.target.value)}`);
    });
  }

  return (
    <div>
      <label htmlFor="orderBy">{orderByLabel}:</label>
      <Select id="orderBy" className="mr-1" defaultValue={orderBy} onChange={onChange} disabled={isTransitioning}>
        {children}
      </Select>
    </div>
  );
}
