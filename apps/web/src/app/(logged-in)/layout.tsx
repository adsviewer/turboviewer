import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { Me } from '@/app/(logged-in)/me';
import { Aside } from '@/app/(logged-in)/aside';
import Toaster from '@/app/(logged-in)/toaster';

export default function LoggedInLayout({ children }: React.PropsWithChildren): JSX.Element {
  return (
    <div className="relative min-h-screen lg:flex lg:flex-row">
      <Aside>
        <Suspense fallback={<Fallback height={48} />}>
          <Me />
        </Suspense>
      </Aside>
      <main className="w-full">{children}</main>
      <Suspense>
        <Toaster />
      </Suspense>
    </div>
  );
}
