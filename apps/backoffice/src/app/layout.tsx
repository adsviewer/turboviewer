import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import './globals.scss';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getLocale, getMessages } from 'next-intl/server';
import { Suspense } from 'react';
import { MainAppShell } from '@/components/shells/main-shell/main-shell';
import SetUserSentry from '@/app/set-user-sentry';
import LoaderCentered from '@/components/misc/loader-centered';

export const metadata: Metadata = {
  title: 'AdsViewer',
  description: 'Get granular insights into your ads performance',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.ReactNode> {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <ColorSchemeScript />
        <NextIntlClientProvider messages={messages}>
          <MantineProvider defaultColorScheme="auto">
            <MainAppShell>
              <SetUserSentry />
              <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
            </MainAppShell>
            <Analytics />
            <SpeedInsights />
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
