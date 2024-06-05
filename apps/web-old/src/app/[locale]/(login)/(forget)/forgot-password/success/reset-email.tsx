'use client';

import { useSearchParams } from 'next/navigation';

export default function ResetEmail(): React.ReactElement {
  const searchParams = useSearchParams();
  return <div className="flex justify-center">{searchParams.get('email') ?? 'no email'}</div>;
}
