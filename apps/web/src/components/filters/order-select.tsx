'use client';

import { type ChangeEvent, useTransition } from 'react';
import Select from '@repo/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type OrderType, useCreateQueryString } from '@/app/[locale]/(logged-in)/insights/query-string-util';

export default function OrderSelect({
  order,
  children,
}: {
  order: OrderType;
  children: React.ReactNode;
}): React.ReactElement {
  const [isTransitioning, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCreateQueryString(searchParams);

  function onChange(event: ChangeEvent<HTMLSelectElement>): void {
    startTransition(() => {
      router.replace(`${pathname}/?${createQueryString('order', event.target.value)}`);
    });
  }

  return (
    <Select defaultValue={order} onChange={onChange} disabled={isTransitioning}>
      {children}
    </Select>
  );
}
