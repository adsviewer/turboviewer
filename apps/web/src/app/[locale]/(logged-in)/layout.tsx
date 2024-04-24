import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { cookies } from 'next/headers';
import { TOKEN_KEY } from '@/env.mjs';
import { Aside } from '@/app/[locale]/(logged-in)/aside';
import { Me } from '@/app/[locale]/(logged-in)/me';
import { AvUrqProvider } from '@/app/[locale]/(logged-in)/urql-provider';
import InitialSetupSubscription from '@/app/[locale]/(logged-in)/initial-setup-subscription';
import Toaster from '@/app/[locale]/(logged-in)/toaster';

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
