import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { cookies } from 'next/headers';
import { Me } from '@/app/(logged-in)/me';
import { Aside } from '@/app/(logged-in)/aside';
import Toaster from '@/app/(logged-in)/toaster';
import { AvUrqProvider } from '@/app/(logged-in)/urql-provider';
import { TOKEN_KEY } from '@/config';
import InitialSetupSubscription from '@/app/(logged-in)/initial-setup-subscription';

export default function LoggedInLayout({ children }: React.PropsWithChildren): JSX.Element {
  const token = cookies().get(TOKEN_KEY)?.value;

  return (
    <div className="relative min-h-screen lg:flex lg:flex-row">
      <Aside>
        <Suspense fallback={<Fallback height={48} />}>
          <Me />
        </Suspense>
      </Aside>
      <main className="w-full">
        <AvUrqProvider token={token}>
          <InitialSetupSubscription />
          {children}
        </AvUrqProvider>
      </main>
      <Suspense>
        <Toaster />
      </Suspense>
    </div>
  );
}
