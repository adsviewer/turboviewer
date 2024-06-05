'use client';

import { type ChangeEvent, useTransition } from 'react';
import Select from '@repo/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type SearchParamsKeys, useCreateQueryString } from '@/app/[locale]/(logged-in)/insights/query-string-util';

export default function SearchParamsSelect<T extends string | number | readonly string[] | undefined>({
  defaultValue,
  children,
  label,
  searchParamKey,
}: {
  defaultValue: T;
  label?: string;
  children: React.ReactNode;
  searchParamKey: SearchParamsKeys;
}): React.ReactElement {
  const [isTransitioning, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCreateQueryString(searchParams);

  function onChange(event: ChangeEvent<HTMLSelectElement>): void {
    startTransition(() => {
      router.replace(`${pathname}/?${createQueryString(searchParamKey, event.target.value)}`);
    });
  }

  return (
    <div>
      {label ? <label htmlFor={searchParamKey}>{label}:</label> : null}
      <Select id={searchParamKey} defaultValue={defaultValue} onChange={onChange} disabled={isTransitioning}>
        {children}
      </Select>
    </div>
  );
}
