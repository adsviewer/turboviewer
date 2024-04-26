'use client';

import { type ChangeEvent, useTransition } from 'react';
import Select from '@repo/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCreateQueryString } from '@/app/[locale]/(logged-in)/insights/query-string-util';

export default function PageSizeSelect({
  pageSize,
  children,
  pageSizeLabel,
}: {
  pageSize: number;
  pageSizeLabel: string;
  children: React.ReactNode;
}): React.ReactElement {
  const [isTransitioning, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCreateQueryString(searchParams);

  function onChange(event: ChangeEvent<HTMLSelectElement>): void {
    startTransition(() => {
      router.replace(`${pathname}/?${createQueryString('pageSize', event.target.value)}`);
    });
  }

  return (
    <div>
      <label htmlFor="pageSize">{pageSizeLabel}:</label>
      <Select id="pageSize" defaultValue={pageSize} onChange={onChange} disabled={isTransitioning}>
        {children}
      </Select>
    </div>
  );
}
