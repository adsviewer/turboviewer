import React, { type JSX, Suspense } from 'react';
import { Fallback } from '@repo/ui/fallback';
import { Aside } from '@/app/[locale]/(logged-in)/aside';
import { Me } from '@/app/[locale]/(logged-in)/me';

export default function SettingsLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="relative min-h-screen lg:flex lg:flex-row">
      <Aside>
        <Suspense fallback={<Fallback height={48} />}>
          <Me />
        </Suspense>
      </Aside>
      <main className="w-full">
        <div className="flex flex-col">
          <div className="flex justify-between gap-4 border-b-2 border-gray-100 p-6">
            <div className="text-4xl font-bold">Settings</div>
          </div>
          <div className="px-6 py-8 mb-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
