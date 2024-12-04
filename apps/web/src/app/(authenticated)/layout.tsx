import { MainAppShell } from '@/components/shells/main-shell/main-shell';
import SetUserSentry from '@/app/(authenticated)/set-user-sentry';
import { Subscriptions } from '../subscriptions';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <MainAppShell>
      <SetUserSentry />
      <Subscriptions />
      {children}
    </MainAppShell>
  );
}
