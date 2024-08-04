import { Suspense } from 'react';
import LoaderCentered from '@/components/misc/loader-centered';
import { MainAppShell } from '@/components/shells/main-shell/main-shell';
import SetUserSentry from '@/app/(authenticated)/set-user-sentry';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <MainAppShell>
      <SetUserSentry />
      <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
    </MainAppShell>
  );
}
