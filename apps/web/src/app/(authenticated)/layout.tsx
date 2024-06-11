import { Suspense } from 'react';
import LoaderCentered from '@/components/misc/loader-centered';
import { MainAppShell } from '@/components/shells/main-shell/main-shell';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <MainAppShell>
      <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
    </MainAppShell>
  );
}
