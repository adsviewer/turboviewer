import { Suspense } from 'react';
import LoaderCentered from '@/components/misc/loader-centered';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <Suspense fallback={<LoaderCentered />}>{children}</Suspense>;
}
