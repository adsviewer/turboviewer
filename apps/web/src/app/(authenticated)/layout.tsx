import { MainAppShell } from '@/components/shells/main-shell/main-shell';
import SetUserSentry from '@/app/(authenticated)/set-user-sentry';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <MainAppShell>
      <SetUserSentry />
      {children}
    </MainAppShell>
  );
}
