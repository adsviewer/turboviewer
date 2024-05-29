import '@repo/ui/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React, { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Toaster from '@/app/[locale]/(logged-in)/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AdsViewer',
  description: 'Get granular insights into your ads performance',
};

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}): React.JSX.Element {
  return (
    <html lang={locale}>
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
        <Suspense>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
